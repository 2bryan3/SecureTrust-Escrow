import React, { useState, useEffect } from "react";
import { NavBar } from "../components/Navbar";
import "../styles/ViewListing.css";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import type { ListingData } from "../types/listing.types";
import LoadingSpinner from "../components/LoadingSpinner";
import { EditListingPopup } from "../components/EditListingPopup";

export const ManageListing: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ListingData | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showSetSoldConfirm, setShowSetSoldConfirm] = useState(false);
  const [showSoldSuccess, setShowSoldSuccess] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/listings/${id}`,
          { withCredentials: true }
        );
        setData(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const deleteListing = async () => {
    if (!data) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/listings/delete`,
        data,
        { withCredentials: true }
      );

      setShowDeleteConfirm(false);
      setShowDeleteSuccess(true);
    } catch (error) {
      console.log(error);
    }
  };

  const toggleSold = async () => {
    if (!data) return;

    try {
      const updatedData = {
        ...data,
        isSold: !data.isSold,
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/listings/update`,
        updatedData,
        { withCredentials: true }
      );

      setData(updatedData);
      setShowSetSoldConfirm(false);
      setShowSoldSuccess(true);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="dl-layout">
      <NavBar/>
      {loading ? (
        <LoadingSpinner size="small" />
      ) : !data ? (
        <p>No listing found.</p>
      ) : (
        <main className="dl-main">
          <button
            className={`vl-back-btn ${
              sidebarOpen ? "sidebar-open" : "sidebar-closed"
            }`}
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <div className="vl-page">
            <div className="vl-container">
              <div className={`vl-image-wrapper ${data.isSold ? "sold" : ""}`}>
                <img
                  src={data.images[0]}
                  alt={data.title}
                  className="vl-image"
                />
                {data.isSold && <div className="vl-sold-banner">SOLD</div>}
              </div>

              <h1 className="vl-title">{data.title}</h1>

              <div className="vl-tags">
                {data.categories.map((tag, i) => (
                  <span key={i} className="vl-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="vl-price">${data.price}</div>

              <div className="vl-section">
                <h2>Description</h2>
                <p>{data.description}</p>
              </div>

              <div className="vl-confirm-buttons">
                <button
                  className="vl-btn-edit"
                  onClick={() => setShowEditPopup(true)}
                >
                  Modify Listing
                </button>

                <button
                  className="vl-btn-sold"
                  onClick={() => setShowSetSoldConfirm(true)}
                >
                  {data.isSold ? "Mark as For Sale" : "Mark as Sold"}
                </button>

                <button
                  className="vl-btn-delete"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Listing
                </button>
              </div>

              {/* SOLD CONFIRM */}
              {showSetSoldConfirm && (
                <div className="vl-confirm-overlay">
                  <div className="vl-confirm-box">
                    <p>
                      {!data.isSold
                        ? "Mark this listing as sold?"
                        : "Mark this item as for sale?"}
                    </p>
                    <div className="vl-confirm-buttons">
                      <button className="confirm-yes" onClick={toggleSold}>
                        Yes
                      </button>
                      <button
                        className="confirm-no"
                        onClick={() => setShowSetSoldConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DELETE CONFIRM */}
              {showDeleteConfirm && (
                <div className="vl-confirm-overlay">
                  <div className="vl-confirm-box">
                    <p>Delete this listing?</p>
                    <p>
                      <b>This action cannot be undone</b>
                    </p>
                    <div className="vl-confirm-buttons">
                      <button className="confirm-yes" onClick={deleteListing}>
                        Yes
                      </button>
                      <button
                        className="confirm-no"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* EDIT POPUP */}
              {showEditPopup && data && (
                <EditListingPopup
                  listingData={data}
                  onClose={() => setShowEditPopup(false)}
                  onSuccess={(updatedData) => {
                    setData(updatedData);
                    setShowEditPopup(false);
                  }}
                />
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
};