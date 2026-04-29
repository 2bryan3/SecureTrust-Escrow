import { useState, useEffect, use } from "react";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { ListingGrid } from "../components/ListingGrid";
import "../styles/Profile.css";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type { ListingData } from "../types/listing.types";
import { Settings, Scale } from "lucide-react";

type Tab = "info" | "listings" | "favorites" | "cases" | "overview" | "ratings";

interface Dispute {
  _id: string;
  listingID: { title: string; price: number };
  buyerID: { firstName: string; lastName: string };
  sellerID: { firstName: string; lastName: string };
  reason: string;
  status: string;
  createdAt: string;
}

interface RatingEntry {
  _id: string;
  reviewerId: { _id: string; firstName: string; lastName: string; avatar: string };
  role: "buyer" | "seller";
  rating: number;
  note: string | null;
  createdAt: string;
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("info");

  // Info tab state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [address, setAddress] = useState("");
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [infoError, setInfoError] = useState(false);

  // Listings tab state
  const [listings, setListings] = useState<ListingData[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Favorites tab state
  const [favorites, setFavorites] = useState<ListingData[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Disputes tab state
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);

  // Stats
  const [statsLoading, setStatsLoading] = useState(true);
  const [listingsCount, setListingsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [disputesCount, setDisputesCount] = useState(0);

  const isMediator = user?.role === "mediator";
  const isAdmin = user?.role === "admin";
  const isPrivileged = isMediator || isAdmin;

  // Rating
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsFilter, setRatingsFilter] = useState<"all" | "seller" | "buyer">("all");

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setUsername(user.username || "");
    setAddress(user.address || "");
  }, [user]);

  useEffect(() => {
    if (activeTab !== "listings") return;
    setListingsLoading(true);
    axios.get("/api/listings/mine", { withCredentials: true })
      .then(res => setListings(res.data.listings))
      .catch(console.error)
      .finally(() => setListingsLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "favorites") return;
    setFavoritesLoading(true);
    axios.get("/api/listings/favorites", { withCredentials: true })
      .then(res => setFavorites(res.data.listings))
      .catch(console.error)
      .finally(() => setFavoritesLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "cases" || !isPrivileged) return;
    setDisputesLoading(true);
    axios.get("/api/disputes", { withCredentials: true })
      .then(res => setDisputes(res.data.disputes))
      .catch(console.error)
      .finally(() => setDisputesLoading(false));
  }, [activeTab]);

  // Stats
  useEffect(() => {
    if (!user) return;
    if (isPrivileged) {
      axios.get("/api/disputes", { withCredentials: true })
        .then(res => {
          const all = res.data.disputes ?? [];
          setDisputesCount(all.filter((d: Dispute) => d.status === "Pending" || d.status === "Under Review").length);
        })
        .catch(console.error)
        .finally(() => setStatsLoading(false));
    } else {
      Promise.all([
        axios.get("/api/listings/mine", { withCredentials: true }),
        axios.get("/api/listings/favorites", { withCredentials: true }),
      ]).then(([listingsRes, favoritesRes]) => {
        setListingsCount(listingsRes.data.listings?.filter((l: any) => !l.isSold).length ?? 0);
        setFavoritesCount(favoritesRes.data.listings?.length ?? 0);
      }).catch(console.error)
        .finally(() => setStatsLoading(false));
    }
  }, [user]);
  //ratings
  useEffect(() => {
    if (activeTab !== "ratings" || !user) return;
    setRatingsLoading(true);
    axios.get(`/api/ratings/user/${user._id}`, { withCredentials: true })
      .then(res => setRatings(res.data.ratings))
      .catch(console.error)
      .finally(() => setRatingsLoading(false));
  }, [activeTab]);

  const handleSaveInfo = async () => {
    try {
      setInfoSaving(true);
      setInfoMsg(null);
      setInfoError(false);
      const updateData: any = { firstName, lastName };
      if (password.trim() !== "") updateData.password = password;
      if (address.trim() !== "") updateData.address = address;
      await axios.put("/api/users/update", updateData, { withCredentials: true });
      await refreshUser();
      setPassword("");
      setInfoMsg("Changes saved successfully.");
      setInfoError(false);
    } catch (err) {
      console.error(err);
      setInfoError(true);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setInfoMsg(err.response.data.message);
      } else {
        setInfoMsg("Failed to save changes.");
      }
    } finally {
      setInfoSaving(false);
    }
  };

  if (!user) return <p>Loading...</p>;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.username?.[0]?.toUpperCase();
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;

  const tabs: Tab[] = isPrivileged
    ? ["info", "cases", "ratings"]
    : ["info", "listings", "favorites", "ratings"];

  const tabLabel = (tab: Tab) => {
    if (tab === "info") return "Profile Info";
    if (tab === "listings") return "My Listings";
    if (tab === "favorites") return "Favorites";
    if (tab === "cases") return "Active Cases";
    if (tab === "ratings") return "Ratings";
    return tab;
  };

  return (
    <>
      <NavBar />
      <main className="profile">

        {/* Profile header */}
        <div className="profile-header">
          <div className="profile-pic-initials">{initials}</div>
          <div className="profile-header-info">
            <h1 className="profile-name">{fullName}</h1>
            <p className="profile-email">{user.email}</p>
            {isAdmin && <span className="profile-role-badge profile-role-badge--admin">Admin</span>}
            {isMediator && <span className="profile-role-badge profile-role-badge--mediator">Mediator</span>}
          </div>
        </div>

        {/* Stats cards */}
        <div className="profile-stats">
          {isPrivileged ? (
            <>
              <div className="profile-stat-card">
                <span className={`profile-stat-value ${disputesCount > 0 ? "profile-stat-value--alert" : ""}`}>
                  {statsLoading ? "—" : disputesCount}
                </span>
                <span className="profile-stat-label">Active Cases</span>
              </div>
              <div className="profile-stat-card">
                <span className="profile-stat-value">{user.role}</span>
                <span className="profile-stat-label">Role</span>
              </div>
              <div className="profile-stat-card">
                <span className="profile-stat-value">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Unknown"}
                </span>
                <span className="profile-stat-label">Member Since</span>
              </div>
              {isAdmin && (
                <div className="profile-stat-card profile-stat-card--link" onClick={() => navigate("/admin")}>
                  <Settings size={22} strokeWidth={1.75} color="var(--muted)" />
                  <span className="profile-stat-label">Admin Dashboard</span>
                </div>
              )}
              <div className="profile-stat-card profile-stat-card--link" onClick={() => navigate("/mediator")}>
                <Scale size={22} strokeWidth={1.75} color="var(--muted)" />
                <span className="profile-stat-label">Mediator Dashboard</span>
              </div>
            </>
          ) : (
            <>
              <div className="profile-stat-card">
                <span className="profile-stat-value">{statsLoading ? "—" : listingsCount}</span>
                <span className="profile-stat-label">Active Listings</span>
              </div>
              <div className="profile-stat-card">
                <span className="profile-stat-value">{statsLoading ? "—" : favoritesCount}</span>
                <span className="profile-stat-label">Favorites</span>
              </div>
              <div className="profile-stat-card">
                <span className="profile-stat-value">{user.totalSales || 0}</span>
                <span className="profile-stat-label">Sales</span>
              </div>
              <div className="profile-stat-card">
                <span className="profile-stat-value">{user.rating || 0} / 5 ⭐</span>
                <span className="profile-stat-label">Rating</span>
              </div>
              <div className="profile-stat-card">
                <span className="profile-stat-value">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Unknown"}
                </span>
                <span className="profile-stat-label">Member Since</span>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`profile-tab ${activeTab === tab ? "profile-tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {/* Profile Info Tab */}
        {activeTab === "info" && (
          <div className="profile-info-tab">
            <div className="profile-fields">
              <h3 className="profile-section-title">Account Details</h3>
              <div className="profile-field-row">
                <div className="profile-field">
                  <label>First Name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
                </div>
                <div className="profile-field">
                  <label>Last Name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
                </div>
                <div className="profile-field" style={{ minWidth: "250px" }}>
                  <label>New Password</label>
                  <div className="password-field">
                    <input
                      type={hidePassword ? "password" : "text"}
                      value={password}
                      placeholder="Leave blank to keep current"
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setHidePassword(!hidePassword)}>
                      {hidePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="profile-field-row">
                <div className="profile-field" style={{ minWidth: "300px" }}>
                  <label>Address</label>
                  <input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Ex: 123 Main Street, Albany, NY 12345"
                  />
                </div>
              </div>
              {infoMsg && (
                <p className={`profile-msg ${infoError ? "profile-msg--error" : "profile-msg--success"}`}>
                  {infoMsg}
                </p>
              )}
              <button className="save-password-btn" onClick={handleSaveInfo} disabled={infoSaving}>
                {infoSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* Active Cases Tab — mediator/admin only */}
        {activeTab === "cases" && (
          <div className="profile-info-tab">
            {disputesLoading ? (
              <p className="profile-empty">Loading cases...</p>
            ) : disputes.filter(d => d.status === "Pending" || d.status === "Under Review").length === 0 ? (
              <p className="profile-empty">No active cases right now.</p>
            ) : (
              <div className="profile-fields">
                {disputes
                  .filter(d => d.status === "Pending" || d.status === "Under Review")
                  .map(d => (
                    <div key={d._id} className="profile-dispute-card" onClick={() => navigate("/mediator")}>
                      <div className="profile-dispute-title">{d.listingID?.title ?? "Unknown listing"}</div>
                      <div className="profile-dispute-meta">
                        {d.buyerID?.firstName} {d.buyerID?.lastName} vs {d.sellerID?.firstName} {d.sellerID?.lastName}
                      </div>
                      <div className="profile-dispute-reason">{d.reason}</div>
                      <span className={`profile-dispute-status profile-dispute-status--${d.status.toLowerCase().replace(" ", "-")}`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* My Listings Tab */}
        {activeTab === "listings" && (
          <div className="profile-listings-tab">
            <ListingGrid items={listings} loading={listingsLoading} myListings={true} />
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === "favorites" && (
          <div className="profile-listings-tab">
            {!favoritesLoading && favorites.length === 0 ? (
              <p className="profile-empty">You haven't saved any listings yet.</p>
            ) : (
              <ListingGrid items={favorites} loading={favoritesLoading} />
            )}
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === "ratings" && (
          <div className="profile-info-tab">
            <div className="profile-fields">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 className="profile-section-title">
                  {ratings.length} Rating{ratings.length !== 1 ? "s" : ""}
                </h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {(["all", "seller", "buyer"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setRatingsFilter(f)}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "999px",
                        border: "1px solid var(--border)",
                        background: ratingsFilter === f ? "var(--accent)" : "transparent",
                        color: ratingsFilter === f ? "#fff" : "var(--muted)",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {f === "all" ? "All" : f === "seller" ? "As Seller" : "As Buyer"}
                    </button>
                  ))}
                </div>
              </div>

              {ratingsLoading ? (
                <p className="profile-empty">Loading ratings…</p>
              ) : ratings.length === 0 ? (
                <p className="profile-empty">No ratings yet.</p>
              ) : (
                ratings
                  .filter(r => ratingsFilter === "all" || r.role === ratingsFilter)
                  .map(r => (
                    <div key={r._id} className="profile-dispute-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div className="profile-pic-initials" style={{ width: 32, height: 32, fontSize: "0.75rem" }}>
                            {r.reviewerId.firstName[0]}{r.reviewerId.lastName[0]}
                          </div>
                          <span className="profile-dispute-title">
                            {r.reviewerId.firstName} {r.reviewerId.lastName}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ color: "var(--gold)", fontSize: "1rem" }}>
                            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                          </span>
                          <span className={`profile-dispute-status profile-dispute-status--${r.role === "seller" ? "under-review" : "pending"}`}>
                            {r.role === "seller" ? "As Seller" : "As Buyer"}
                          </span>
                        </div>
                      </div>
                      {r.note && (
                        <p className="profile-dispute-reason" style={{ marginTop: "0.5rem" }}>{r.note}</p>
                      )}
                      <div className="profile-dispute-meta">
                        {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}