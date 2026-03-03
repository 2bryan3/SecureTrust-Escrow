// frontend/src/pages/ViewListing.tsx
import React, { useEffect, useState } from "react";
import "../styles/ViewListing.css";
import { useNavigate, useParams } from "react-router-dom";
import type { ListingData } from "../types/listing.types";
import LoadingSpinner from "../components/LoadingSpinner";
import { ListingDashboardPopup } from "../components/ListingDashboardPopup";
import { EditListingPopup } from "../components/EditListingPopup";
import { sampleListings } from "../data/sampleListings";
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  // Check if logged-in user owns this listing
  const isOwner = user && data && user._id === data.user._id;

  useEffect(() => {
    if (!id) return;
    const listing = sampleListings.find((l) => l._id === id);
    if (!listing) {
      setError("Listing not found.");
      setLoading(false);
      return;
    }
    setData(listing);
    setLoading(false);
  }, [id]);

  const handleEditSuccess = (updatedData: ListingData) => {
    setData(updatedData);
    setShowEdit(false);
  };

  if (loading) return <LoadingSpinner size="small" />;
  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>No listing found.</p>;

  return (
    <div className="dl-layout viewlisting-bg">
      <main className="dl-main">
        <button className="vl-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="vl-page">
          <div className="vl-container">

            {/* Image */}
            <div className="vl-image-wrapper">
              <img src={data.images[0]} alt={data.title} className="vl-image" />
            </div>

            {/* Title + owner actions */}
            <div className="vl-title-row">
              <h1 className="vl-title">{data.title}</h1>
              {isOwner && (
                <button
                  className="vl-edit-btn"
                  onClick={() => setShowEdit(true)}
                >
                  ✏️ Edit Listing
                </button>
              )}
            </div>

            {/* Tags */}
            <div className="vl-tags">
              {data.categories.map((tag, i) => (
                <span key={i} className="vl-tag">{tag}</span>
              ))}
            </div>

            <div className="vl-price">${data.price}</div>

            <p className="vl-status-label">
              Listing Status: {data.isSold ? "Sold" : "Available"}
            </p>

            {/* Description */}
            <div className="vl-section">
              <h2>Description</h2>
              <p>{data.description}</p>
            </div>

            {/* Seller */}
            <div className="vl-section">
              <h2>Seller Information</h2>
              <div className="vl-seller-row">
                <div className="vl-seller-initials">
                  {getInitials(data.user.username)}
                </div>
                <div className="vl-seller-name">{data.user.username}</div>
              </div>
            </div>

            {/* Manage Sale — only show to owner */}
            {isOwner && (
              <button
                className="vl-dashboard-btn"
                onClick={() => setShowDashboard(true)}
              >
                Manage Sale
              </button>
            )}

            {showDashboard && (
              <ListingDashboardPopup
                listingTitle={data.title}
                milestones={[
                  { id: "1", title: "Milestone 1", status: "Pending" },
                  { id: "2", title: "Milestone 2", status: "Completed" },
                ]}
                escrowAmount={500}
                onClose={() => setShowDashboard(false)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Edit popup — renders on top of everything */}
      {showEdit && (
        <EditListingPopup
          listingData={data}
          onClose={() => setShowEdit(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};