import React from "react";
import "../styles/ListingGrid.css";
import type { ListingData } from "../types/listing.types";
import { ListingCard } from "./ListingCard";
import LoadingSpinner from "./LoadingSpinner";

type Props = {
  items: ListingData[];
  myListings?: boolean;
  loading?: boolean;
  onListingClick?: (id: string) => void;
};

export const ListingGrid: React.FC<Props> = ({ items, loading, onListingClick }) => {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="listing-grid">
        {items.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", gridColumn: "1/-1" }}>
            No listings yet.
          </p>
        ) : (
          items.map((item) => (
            <ListingCard
              key={item._id}
              listing={item}
              onClick={() => onListingClick?.(item._id)}
            />
          ))
        )}
      </div>
    </div>
  );
};