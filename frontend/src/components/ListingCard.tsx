// src/components/ListingCard.tsx
import React from "react";
import "../styles/ListingCard.css";
import type { ListingData } from "../types/listing.types";

type ListingCardProps = {
  listing: ListingData;
  onClick: () => void;
};

// Derive a simple condition tag from listing data.
// Adjust this logic to match your actual ListingData shape.
const getTag = (listing: ListingData) => {
  if (listing.isSold) return null; // sold badge already shown
  
  // "New" if listed within the last 7 days
  const isNew = (Date.now() - new Date(listing.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
  if (isNew) return { label: "New", cls: "dl-card-tag--new" };
  
  // "Escrow" if price is over $100
  if (listing.price >= 100) return { label: "Escrow", cls: "dl-card-tag--escrow" };
  
  return null;
};

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const tag = getTag(listing);

  return (
    <article className="dl-card" onClick={onClick}>
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