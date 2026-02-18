import React from "react";
import "../styles/ListingCard.css";
import type { ListingData } from "../types/listing.types";

type ListingCardProps = {
  listing: ListingData;
  onClick: () => void;
};

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  return (
    <article className="dl-card" onClick={onClick}>
      <div className="dl-card-image-wrapper">
        <img
          className="dl-card-image"
          src={listing.images[0]}
          alt={listing.title}
        />
        {listing.isSold && <span className="dl-card-sold">SOLD</span>}
      </div>

      <div className="dl-card-body">
        <h3 className="dl-card-title">{listing.title}</h3>
        <p className="dl-card-price">${listing.price}</p>
        <p className="dl-card-category">{listing.categories.join(", ")}</p>
      </div>
    </article>
  );
};