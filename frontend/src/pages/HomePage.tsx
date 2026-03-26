// src/pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { NavBar } from "../components/NavBar";
import { HeroBanner } from "../components/HeroBanner";
import { StatsStrip } from "../components/StatStrip";
import { CategoryChips } from "../components/Categories";
import { ListingGrid } from "../components/ListingGrid";
import { Footer } from "../components/Footer";
import type { ListingData } from "../types/listing.types";
import "../styles/HomePage.css";

const API = import.meta.env.VITE_API_URL;

export const HomePage = () => {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const category = selectedCategory === "All" ? "" : selectedCategory;
        const res = await axios.get(`/api/listings`, {
          params: { ...(category && { category }) },
          withCredentials: true,
        });
        setListings(res.data.listings);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load listings.");
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [selectedCategory]);

  return (
  <div className="home-page">
    <NavBar />
    <div className="home-content">
      <HeroBanner />
      <StatsStrip />
      <CategoryChips onSelect={(cat) => setSelectedCategory(cat)} />
      <h2 className="section-title">New Listings</h2>
      {error ? (
        <p style={{ color: "var(--muted)", textAlign: "center" }}>{error}</p>
      ) : (
        <ListingGrid
          items={listings}
          myListings={false}
          loading={loading}
        />
      )}
      <Footer />
    </div>
  </div>
);
};