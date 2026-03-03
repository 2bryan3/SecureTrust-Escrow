import React from "react";
import "../styles/ListingCard.css";
import type { ListingData } from "../types/listing.types";
import { useNavigate } from "react-router-dom";

type ListingCardProps = {
  listing: ListingData;
  onClick?: () => void;
};

// Derive a simple condition tag from listing data.
const getTag = (listing: ListingData) => {
  if (listing.isSold) return null;

  const isNew = (Date.now() - new Date(listing.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
  if (isNew) return { label: "New", cls: "dl-card-tag--new" };

  if (listing.price >= 100) return { label: "Escrow", cls: "dl-card-tag--escrow" };

  return null;
};

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const navigate = useNavigate();
  const tag = getTag(listing);

  const handleClick = () => {
    navigate(`/listing/${listing._id}`);
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
          className="dl-card-fav"
          onClick={(e) => e.stopPropagation()}
          aria-label="Save to favourites"
        >
          🤍
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