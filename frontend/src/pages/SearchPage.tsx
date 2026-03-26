import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListingGrid } from "../components/ListingGrid";
import type { ListingData } from "../types/listing.types";
import "../styles/SearchPage.css";
import { NavBar } from "../components/NavBar";

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/listings/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => { setListings(data.listings ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q]);

  return (
    <>
    < NavBar />
    <div className="search-page">
      <div className="search-page-header">
        <p className="search-page-label">Search results for</p>
        <h1 className="search-page-query">"{q}"</h1>
        {!loading && (
          <p className="search-page-count">
            {listings.length} listing{listings.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>
      <ListingGrid items={listings} loading={loading} />
    </div>
    </>
  );
};