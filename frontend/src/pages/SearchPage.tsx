import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ListingGrid } from "../components/ListingGrid";
import type { ListingData } from "../types/listing.types";
import "../styles/SearchPage.css";
import { NavBar } from "../components/NavBar";

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const q          = searchParams.get("q") || "";
  const category   = searchParams.get("category") || "";
  const sortBy     = searchParams.get("sortBy") || "newest";
  const minPrice   = searchParams.get("minPrice") || "";
  const maxPrice   = searchParams.get("maxPrice") || "";
  const city       = searchParams.get("city") || "";
  const street     = searchParams.get("street") || "";
  const state      = searchParams.get("state") || "";
  const attributes = searchParams.get("attributes") || "";

  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading]   = useState(true);

  const hasAdvancedFilters = category || minPrice || maxPrice || attributes || sortBy !== "newest" || city || street || state;

  useEffect(() => {
    if (!q && !hasAdvancedFilters) {
      setLoading(false);
      return;
    }

    setLoading(true);

    if (hasAdvancedFilters) {
      const params = new URLSearchParams();
      if (q)          params.set("name", q);
      if (category)   params.set("category", category);
      if (sortBy)     params.set("sortBy", sortBy);
      if (minPrice)   params.set("minPrice", minPrice);
      if (maxPrice)   params.set("maxPrice", maxPrice);
      if (city)       params.set("city", city);
      if (street)     params.set("street", street);
      if (state)      params.set("state", state);
      if (attributes) params.set("attributes", attributes);

      fetch(`/api/listings?${params.toString()}`, { credentials: "include" })
        .then(r => r.json())
        .then(data => { setListings(data.listings ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      fetch(`/api/listings/search?q=${encodeURIComponent(q)}`, { credentials: "include" })
        .then(r => r.json())
        .then(data => { setListings(data.listings ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [q, category, sortBy, minPrice, maxPrice, attributes, city, street, state]);

  const filterSummary: string[] = [];
  if (category && (q || minPrice || maxPrice || attributes)) filterSummary.push(category);
  if (minPrice && maxPrice) filterSummary.push(`$${minPrice}–$${maxPrice}`);
  else if (minPrice) filterSummary.push(`$${minPrice}+`);
  else if (maxPrice) filterSummary.push(`up to $${maxPrice}`);
  if (city) filterSummary.push(city);
  if (street) filterSummary.push(street);
  if (state) filterSummary.push(state);
  if (attributes) {
    try {
      const parsed = JSON.parse(attributes);
      Object.entries(parsed).forEach(([k, v]) => filterSummary.push(`${k}: ${v}`));
    } catch { /* ignore */ }
  }

  return (
    <>
      <NavBar />
      <div className="search-page">
        <div className="search-page-header">
          {q ? (
            <>
                <p className="search-page-label">Search results for</p>
                <h1 className="search-page-query">"{q}"</h1>
            </>
            ) : category && !minPrice && !maxPrice && !attributes ? (
            <>
                <p className="search-page-label">Showing results for</p>
                <h1 className="search-page-query">{category}</h1>
            </>
            ) : (
            <h1 className="search-page-query">Browse Listings</h1>
            )}
          {filterSummary.length > 0 && (
            <div className="search-page-filters">
              {filterSummary.map((f, i) => (
                <span key={i} className="search-filter-chip">{f}</span>
              ))}
              <button
                className="search-filter-clear"
                onClick={() => navigate("/search/advanced")}
              >
                Edit filters
              </button>
            </div>
          )}
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