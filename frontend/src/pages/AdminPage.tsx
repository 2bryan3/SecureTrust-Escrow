// frontend/src/pages/AdminPage.tsx
import React, { useState, useEffect, useRef } from "react";
import "../styles/AdminPage.css";
import axios from "axios";
import { api } from "../api/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: "user" | "mediator" | "admin";
  createdAt: string;
  listingCount?: number;
  isBanned: boolean;
}

interface AdminListing {
  _id: string;
  title: string;
  price: number;
  isSold: boolean;
  createdAt: string;
}

interface AdminLog {
  _id: string;
  action: string;
  target: string;
  admin: string;
  date: string;
}

interface PlatformStats {
  totalUsers: number;
  activeListings: number;
  openDisputes: number;
  totalRevenue: number;
}

interface DisputeUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DisputeListing {
  _id: string;
  title: string;
  price: number;
}

interface Dispute {
  _id: string;
  listingID: DisputeListing;
  buyerID: DisputeUser;
  sellerID: DisputeUser;
  reportedBy: DisputeUser;
  reason: string;
  status: "Pending" | "Under Review" | "Resolved" | "Refunded" | "Dismissed";
  createdAt: string;
}

type Tab = "overview" | "users" | "listings" | "logs";
type UserRole = "user" | "mediator" | "admin";

// ── CustomSelect (inline, same contract as app-wide component) ───────────────

interface SelectOption { label: string; value: string }

const InlineSelect: React.FC<{
  options: SelectOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="cs-wrap" ref={ref}>
      <button
        type="button"
        className="cs-trigger"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span>{selected?.label ?? placeholder ?? "Select…"}</span>
        <svg
          className={`cs-caret ${open ? "cs-caret--open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="cs-dropdown">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`cs-item ${value === o.value ? "cs-item--active" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtPrice = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// ── AdminPage ─────────────────────────────────────────────────────────────────

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Data state
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals / toasts
  const [roleModal, setRoleModal] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [confirmDelete, setConfirmDelete] = useState<AdminListing | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmBan, setConfirmBan] = useState<AdminUser | null>(null);

  // Search / filter
  const [userSearch, setUserSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [showBanned, setShowBanned] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<AdminUser[]>("/users/all");
      setUsers(data);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/listings", { withCredentials: true });
      setListings(res.data.listings ?? []);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await axios.get("/api/disputes", { withCredentials: true });
      setDisputes(res.data.disputes ?? []);
    } catch (e: any) {
      console.error(e);
    }
  };


  useEffect(() => {
    if (activeTab === "overview") {
      fetchUsers();
      fetchListings();
      fetchDisputes();
    }
    if (activeTab === "users") fetchUsers();
    if (activeTab === "listings") fetchListings();
  }, [activeTab]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleBan = async () => {
    if (!confirmBan) return;
    try {
      await api(`/users/ban/${confirmBan._id}`, { method: "POST" });
      setUsers(prev => prev.filter(u => u._id !== confirmBan._id));
      showToast(`${confirmBan.username} has been banned`);
      setConfirmBan(null);
    } catch {
      showToast("Action failed — try again");
    }
  };

  const handleRoleChange = async () => {
    if (!roleModal) return;
    try {
      await api(`/users/${roleModal._id}/role`, { method: "PATCH", body: { role: newRole } });
      setUsers(prev => prev.map(u => u._id === roleModal._id ? { ...u, role: newRole } : u));
      showToast(`${roleModal.username} is now a ${newRole}`);
      setRoleModal(null);
    } catch {
      showToast("Role change failed — try again");
    }
  };

  const handleDeleteListing = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/listings/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ _id: confirmDelete._id }),
      });
      if (!res.ok) throw new Error();
      setListings((prev) => prev.filter((l) => l._id !== confirmDelete._id));
      showToast(`"${confirmDelete.title}" removed`);
      setConfirmDelete(null);
    } catch {
      showToast("Delete failed — try again");
    }
  };

  // ── Derived stats (fallback if /stats endpoint not ready) ───────────────────

 const derivedStats = [
  { label: "Total Users",      value: stats?.totalUsers    ?? users.length,                                        color: "blue"  },
  { label: "Active Listings",  value: stats?.activeListings ?? listings.filter((l) => !l.isSold).length,           color: "cyan"  },
  { label: "Open Disputes",    value: stats?.openDisputes  ?? disputes.filter(d => d.status === "Pending" || d.status === "Under Review").length, color: "gold"  },
  { label: "Completed Transactions",   value: listings.filter((l) => l.isSold).length,           color: "green" },
  ];

  // ── Filtered lists ───────────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) => {
    if (showBanned ? !u.isBanned : u.isBanned) return false;
    return (
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  });

  const filteredListings = listings.filter(
  (l: any) =>
    l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
    l.categories?.[0]?.toLowerCase().includes(listingSearch.toLowerCase()) ||
    l.user?.username?.toLowerCase().includes(listingSearch.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  const tabConfig: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "listings", label: "Listings" },
  ];

  return (
    <div className="admin-page">

      {/* Toast */}
      {toast && <div className="admin-toast">{toast}</div>}

      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Platform management &amp; oversight</p>
        </div>
        <div className="admin-badge">Admin</div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {tabConfig.map(({ id, label }) => (
          <button
            key={id}
            className={`admin-tab ${activeTab === id ? "admin-tab--active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="admin-error-banner">
          ⚠ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="admin-content">
          <div className="stats-grid">
            {derivedStats.map((s) => (
              <div key={s.label} className={`stat-card stat-card--${s.color}`}>
                <div className="stat-value">{loading ? "…" : s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="admin-section">
            <div className="section-header-row">
              <h2 className="section-heading">Recent Users</h2>
              <button className="section-link" onClick={() => setActiveTab("users")}>View all →</button>
            </div>
            {loading ? (
              <div className="admin-loading">Loading…</div>
            ) : (
              <div className="user-table">
                <div className="user-table-header">
                  <span>User</span><span>Role</span><span>Listings</span><span>Status</span>
                </div>
                {users.slice(0, 4).map((u) => (
                  <div key={u._id} className="user-row">
                    <div className="user-info">
                      <div className="user-avatar">
                        {`${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="user-name">{u.firstName} {u.lastName}</div>
                        <div className="user-email">{u.email}</div>
                      </div>
                    </div>
                    <span className={`role-badge role-badge--${u.role}`}>{u.role}</span>
                    <span className="user-listings">{u.listingCount ?? "—"}</span>
                    <span className={`status-pill status-pill--${u.isBanned ? "suspended" : "active"}`}>
                      {u.isBanned ? "Banned" : "Active"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="admin-section">
            <div className="section-header-row">
              <h2 className="section-heading">Open Disputes</h2>
            </div>
            {disputes.filter(d => d.status === "Pending" || d.status === "Under Review").length === 0 ? (
              <div className="admin-empty">No open disputes.</div>
            ) : (
              <div className="user-table">
                <div className="user-table-header" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
                  <span>Listing</span><span>Buyer</span><span>Seller</span><span>Status</span><span>Opened</span>
                </div>
                {disputes
                  .filter(d => d.status === "Pending" || d.status === "Under Review")
                  .map(d => (
                    <div key={d._id} className="user-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
                      <div className="listing-title">{d.listingID?.title ?? "—"}</div>
                      <span className="user-email">{d.buyerID?.firstName} {d.buyerID?.lastName}</span>
                      <span className="user-email">{d.sellerID?.firstName} {d.sellerID?.lastName}</span>
                      <span className={`status-pill status-pill--${d.status === "Pending" ? "pending" : "review"}`}>
                        {d.status}
                      </span>
                      <span className="user-joined">{fmt(d.createdAt)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === "users" && (
        <div className="admin-content">
          <div className="admin-section">
            <div className="section-header-row">
              <h2 className="section-heading">All Users</h2>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <button
                  className={`action-pill ${showBanned ? "action-pill--red" : "action-pill--blue"}`}
                  onClick={() => setShowBanned(!showBanned)}
                >
                  {showBanned ? "Show Active" : "Show Banned"}
                </button>
                <input
                  className="admin-search"
                  placeholder="Search by name or email…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>
            {loading ? (
              <div className="admin-loading">Loading users…</div>
            ) : (
              <div className="user-table">
                <div className="user-table-header user-table-header--full">
                  <span>User</span><span>Role</span><span>Joined</span>
                  <span>Listings</span><span>Status</span><span>Actions</span>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="admin-empty">No users found.</div>
                )}
                {filteredUsers.map((u) => (
                  <div key={u._id} className="user-row user-row--full">
                    <div className="user-info">
                      <div className="user-avatar">{u.username}</div>
                      <div>
                        <div className="user-name">{u.firstName} {u.lastName}</div>
                        <div className="user-email">{u.email}</div>
                      </div>
                    </div>
                    <span className={`role-badge role-badge--${u.role}`}>{u.role}</span>
                    <span className="user-joined">{fmt(u.createdAt)}</span>
                    <span className="user-listings">{u.listingCount ?? "—"}</span>
                    <span className={`status-pill ${u.isBanned ? "status-pill--suspended" : "status-pill--active"}`}>
                      {u.isBanned ? "Banned" : "Active"}
                    </span>
                    <div className="user-actions">
                      <button
                        className="action-pill action-pill--blue"
                        onClick={() => { setRoleModal(u); setNewRole(u.role); }}
                      >
                        Role
                      </button>
                      {!u.isBanned && (
                        <button className="action-pill action-pill--red" onClick={() => setConfirmBan(u)}>
                          Ban
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LISTINGS ── */}
      {activeTab === "listings" && (
        <div className="admin-content">
          <div className="admin-section">
            <div className="section-header-row">
              <h2 className="section-heading">All Listings</h2>
              <input
                className="admin-search"
                placeholder="Search by title, category, or seller…"
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
              />
            </div>
            {loading ? (
              <div className="admin-loading">Loading listings…</div>
            ) : (
              <div className="user-table">
                <div className="listing-table-header">
                  <span>Title</span><span>Seller</span><span>Category</span>
                  <span>Price</span><span>Listed</span><span>Status</span><span>Actions</span>
                </div>
                {filteredListings.length === 0 && (
                  <div className="admin-empty">No listings found.</div>
                )}
                {filteredListings.map((l) => {
                  const listing = l as any;
                  return (
                    <div key={listing._id} className="user-row listing-row">
                      <div className="listing-title">{listing.title}</div>
                      <span className="listing-seller">{listing.user ? `${listing.user.firstName} ${listing.user.lastName}` : "—"}</span>
                      <span className="listing-category">{listing.categories?.[0] ?? "—"}</span>
                      <span className="listing-price">{fmtPrice(listing.price)}</span>
                      <span className="user-joined">{fmt(listing.createdAt)}</span>
                      <span className={`status-pill status-pill--${listing.isSold ? "sold" : "active"}`}>
                        {listing.isSold ? "Sold" : "Active"}
                      </span>
                      <div className="user-actions">
                        <button className="action-pill action-pill--red" onClick={() => setConfirmDelete(l)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Role Modal ── */}
      {roleModal && (
        <div className="admin-overlay" onClick={() => setRoleModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Role — {roleModal.username}</h3>
              <button className="close-btn" onClick={() => setRoleModal(null)}>×</button>
            </div>
            <p className="modal-desc">
              Mediators can review and resolve disputes. Admins have full platform access.
            </p>
            <InlineSelect
              options={[
                { value: "user", label: "User — Standard marketplace access" },
                { value: "mediator", label: "Mediator — Can resolve disputes" },
                { value: "admin", label: "Admin — Full platform access" },
              ]}
              value={newRole}
              onChange={(v) => setNewRole(v as UserRole)}
            />
            <div className="modal-actions">
              <button className="confirm-cancel" onClick={() => setRoleModal(null)}>Cancel</button>
              <button className="confirm-submit" onClick={handleRoleChange}>Save Role</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {confirmDelete && (
        <div className="admin-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="admin-modal admin-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Remove Listing</h3>
              <button className="close-btn" onClick={() => setConfirmDelete(null)}>×</button>
            </div>
            <p className="modal-desc">
              Are you sure you want to remove <strong>"{confirmDelete.title}"</strong>?
              This action will be logged and cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="confirm-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="confirm-submit confirm-submit--danger" onClick={handleDeleteListing}>
                Remove Listing
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Ban Confirm Modal ── */}
      {confirmBan && (
        <div className="admin-overlay" onClick={() => setConfirmBan(null)}>
          <div className="admin-modal admin-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ban User</h3>
              <button className="close-btn" onClick={() => setConfirmBan(null)}>×</button>
            </div>
            <p className="modal-desc">
              Are you sure you want to ban <strong>{confirmBan.firstName} {confirmBan.lastName}</strong>?
              All their listings will be deleted and they will no longer be able to access the platform.
            </p>
            <div className="modal-actions">
              <button className="confirm-cancel" onClick={() => setConfirmBan(null)}>Cancel</button>
              <button className="confirm-submit confirm-submit--danger" onClick={handleBan}>
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};