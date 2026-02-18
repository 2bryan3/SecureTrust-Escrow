// src/pages/HomePage.tsx
import React from "react";
import { sampleListings } from "../data/sampleListings";
import { ListingGrid } from "../components/ListingGrid";
import "../styles/HomePage.css";

// Dummy components for prototype
const Header = () => (
  <header className="header">
  <span className="logo">SecureTrust</span>
  <div className="header-actions">
    <input className="search-bar" placeholder="Search for items..." />
    <div className="user-actions">Login | Signup</div>
  </div>
</header>
);

const HeroBanner = () => (
  <section className="hero-banner">
    <h1>Buy & Sell with Confidence</h1>
    <p>Secure escrow for every transaction</p>
    <button>Explore Listings</button>
  </section>
);

const CategoryChips = () => (
  <section className="category-chips">
    {["Electronics", "Services", "Furniture", "Books"].map((cat) => (
      <button key={cat} className="chip">
        {cat}
      </button>
    ))}
  </section>
);

const Footer = () => (
  <footer className="footer">
    <p>© 2026 SecureTrust Escrow App. All rights reserved.</p>
  </footer>
);

export const HomePage = () => {
  return (
    <div className="home-page">
      <Header />
      <HeroBanner />
      <CategoryChips />
      <h2 className="section-title">New Listings</h2>
      <ListingGrid items={sampleListings} myListings={false} />
      <Footer />
    </div>
  );
};