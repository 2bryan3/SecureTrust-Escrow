// src/pages/HomePage.tsx
import React from "react";
import { sampleListings } from "../data/sampleListings";
import { NavBar } from "../components/NavBar";
import { HeroBanner } from "../components/HeroBanner";
import { StatsStrip } from "../components/StatStrip";
import { CategoryChips } from "../components/Categories";
import { ListingGrid } from "../components/ListingGrid";
import { Footer } from "../components/Footer";
import "../styles/HomePage.css";

export const HomePage = () => {
  return (
    <div className="home-page">
      <NavBar />
      <HeroBanner />
      <StatsStrip />
      <CategoryChips />
      <h2 className="section-title">New Listings</h2>
      <ListingGrid items={sampleListings} myListings={false} />
      <Footer />
    </div>
  );
};