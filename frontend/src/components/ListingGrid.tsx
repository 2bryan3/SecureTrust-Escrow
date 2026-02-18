import React from "react";
import "../styles/ListingGrid.css";
import type { ListingData } from "../types/listing.types";
import { ListingCard } from "./ListingCard";

type Props = {
  items: ListingData[];
  myListings?: boolean; // optional
};

export const ListingGrid: React.FC<Props> = ({ items }) => {
  return (
    <div className="listing-grid">
      {items.map((item) => (
        <ListingCard
          key={item._id}
          listing={item}
          onClick={() => console.log("Clicked", item.title)}
        />
      ))}
    </div>
  );
};