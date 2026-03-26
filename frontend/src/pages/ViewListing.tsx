import React, { useEffect, useState } from "react";
import "../styles/ViewListing.css";
import { useNavigate, useParams } from "react-router-dom";
import type { ListingData } from "../types/listing.types";
import LoadingSpinner from "../components/LoadingSpinner";
import { ListingDashboardPopup } from "../components/ListingDashboardPopup";
import { EditListingPopup } from "../components/EditListingPopup";
import { useAuth } from "../context/AuthContext";

export const ViewListing: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ListingData>();
  const [error, setError] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [attribsOpen, setAttribsOpen] = useState(false);
  const formatKey = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, str => str.toUpperCase())
      .trim();

  const isOwner = user && data && user._id === data.user._id;

  useEffect(() => {
    if (!id) return;
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`, { credentials: "include" });
        if (!res.ok) { setError("Listing not found."); return; }
        const json = await res.json();
        setData(json);
      } catch {
        setError("Failed to load listing.");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleEditSuccess = (updatedData: ListingData) => {
    setData(updatedData);
    setShowEdit(false);
  };

  if (loading) return <LoadingSpinner size="small" />;
  if (error) return <p className="vl-error">Error: {error}</p>;
  if (!data) return <p className="vl-error">No listing found.</p>;

  const hasAttributes = data.attributes && Object.keys(data.attributes).length > 0;

  return (
    <div className="vl-page-bg">

      {/* Top bar */}
      <div className="vl-topbar">
        <button className="vl-back-btn" onClick={() => navigate(-1)}>← Back</button>
        {isOwner && (
          <button className="vl-edit-btn" onClick={() => setShowEdit(true)}>
            ✏️ Edit Listing
          </button>
        )}
      </div>

      <div className="vl-page-layout">

        {/* LEFT — images */}
        <div className="vl-left">
          <div className="vl-main-image-wrapper">
            <img
              src={data.images[currentImage]}
              alt={data.title}
              className="vl-main-image"
            />
            {data.isSold && <div className="vl-sold-badge">SOLD</div>}
          </div>
          {data.images.length > 1 && (
            <div className="vl-thumbnails">
              {data.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`thumb-${i}`}
                  className={`vl-thumb ${i === currentImage ? "vl-thumb--active" : ""}`}
                  onClick={() => setCurrentImage(i)}
                />
              ))}
            </div>
          )}

          {/* Seller — below images */}
          <div className="vl-section" style={{ marginTop: "1.5rem" }}>
            <h2>Seller</h2>
            <div className="vl-seller-card">
              <div className="vl-seller-avatar">
                {data.user.firstName?.charAt(0).toUpperCase()}
                {data.user.lastName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="vl-seller-name">
                  {data.user.firstName} {data.user.lastName}
                </div>
                <div className="vl-seller-email">{data.user.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — details */}
          <div className="vl-right">

            {/* Categories */}
            <div className="vl-tags">
              {data.categories.map((tag, i) => (
                <span key={i} className="vl-tag">{tag}</span>
              ))}
            </div>

            {/* Title */}
            <h1 className="vl-title">{data.title}</h1>

            {/* Price + status */}
            <div className="vl-price">${data.price.toLocaleString()}</div>
            <p className="vl-status-label">
              Status:{" "}
              <span className={data.isSold ? "vl-status--sold" : "vl-status--available"}>
                {data.isSold ? "Sold" : "Available"}
              </span>
            </p>

            <p className="vl-status-label">
              Delivery:{" "}
              <span className="vl-delivery-method">
                {data.deliveryMethod === "shipping" ? "Shipping" : "Local Pickup"}
              </span>
            </p>

            <div className="vl-divider" />

            {/* Description */}
            <div className="vl-section">
              <h2>Description</h2>
              <p>{data.description}</p>
            </div>

            {/* Item details — always visible */}
            {hasAttributes && (
              <div className="vl-section">
                <h2>Item Details</h2>
                <div className="vl-attributes-grid">
                  {Object.entries(data.attributes!).map(([key, value]) => (
                    <div key={key} className="vl-attribute-row">
                      <span className="vl-attribute-key">{formatKey(key)}</span>
                      <span className="vl-attribute-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="vl-actions">
              {!isOwner && !data.isSold && (
                <button className="vl-btn-primary" onClick={() => alert("Buy now functionality coming soon!")}>
                  Buy Now
                </button>
              )}
              <button className="vl-btn-secondary" onClick={() => setShowDashboard(true)}>
                Manage Sale
              </button>
            </div>

          </div>

      {/* Popups */}
      {showDashboard && (
        <ListingDashboardPopup
          listingTitle={data.title}
          deliveryMethod={data.deliveryMethod}
          escrowAmount={data.price}
          isOwner={!!isOwner}
          listingID={data._id}
          sellerID={data.user._id}
          onClose={() => setShowDashboard(false)}
        />
      )}

      {showEdit && (
        <EditListingPopup
          listingData={data}
          onClose={() => setShowEdit(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
    </div>
  );
};