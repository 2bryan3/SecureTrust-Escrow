import React, { useState } from "react";
import "../styles/ListingCard.css";
import type { ListingData } from "../types/listing.types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ListingCardProps = {
  listing: ListingData;
  onClick?: () => void;
};

const getTag = (listing: ListingData) => {
  if (listing.isSold) return null;
  const isNew = (Date.now() - new Date(listing.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
  if (isNew) return { label: "New", cls: "dl-card-tag--new" };
  if (listing.price >= 100) return { label: "Escrow", cls: "dl-card-tag--escrow" };
  return null;
};

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tag = getTag(listing);

  const [favorited, setFavorited] = useState(listing.isFavorited ?? false);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    navigate(`/listing/${listing._id}`);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    if (loading) return;
    setLoading(true);

    // Optimistic update
    setFavorited(prev => !prev);

    try {
      const res = await fetch(`/api/listings/favorite/${listing._id}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        // Revert if failed
        setFavorited(prev => !prev);
      }
    } catch {
      setFavorited(prev => !prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="dl-card" onClick={handleClick}>
      <div className="dl-card-image-wrapper">
        <img
          className="dl-card-image"
          src={listing.images[0]}
          alt={listing.title}
        />
        {listing.isSold && <span className="dl-card-sold">SOLD</span>}
        <button
          className={`dl-card-fav ${favorited ? "dl-card-fav--active" : ""}`}
          onClick={handleFavorite}
          aria-label={favorited ? "Remove from favourites" : "Save to favourites"}
        >
          {favorited ? "❤️" : "🤍"}
        </button>
      </div>
      <div className="dl-card-body">
        <h3 className="dl-card-title">{listing.title}</h3>
        <div className="dl-card-price-row">
          <p className="dl-card-price">${listing.price.toLocaleString()}</p>
          {tag && <span className={`dl-card-tag ${tag.cls}`}>{tag.label}</span>}
        </div>
        <p className="dl-card-category">{listing.categories.join(", ")}</p>
      </div>
    </article>
  );
};