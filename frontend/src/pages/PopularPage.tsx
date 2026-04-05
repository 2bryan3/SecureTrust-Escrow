import React, { useEffect, useState } from "react";
import { ListingGrid } from "../components/ListingGrid";
import type { ListingData } from "../types/listing.types";
import "../styles/PopularPage.css";
import { NavBar } from "../components/NavBar";

export const PopularPage: React.FC = () => {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/listings/popular")
      .then(r => r.json())
      .then(data => { setListings(data.listings ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <NavBar />
      <div className="popular-page">
        <div className="popular-hero">
            <div className="popular-hero-rays popular-hero-rays--left" />
            <div className="popular-hero-rays popular-hero-rays--right" />
            <div className="popular-hero-content">
            <h1 className="popular-hero-title">Popular <span>Now</span></h1>
            <p className="popular-hero-sub">The most saved listings on SecureTrust</p>
            {!loading && (
                <span className="popular-hero-count">
                {listings.length} listing{listings.length !== 1 ? "s" : ""}
                </span>
            )}
            </div>
        </div>
        <div className="popular-grid-section">
          <ListingGrid items={listings} loading={loading} showFavoriteCount />
        </div>
      </div>
    </>
  );
};