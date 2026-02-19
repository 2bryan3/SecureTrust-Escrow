// src/pages/HomePage.tsx
import React from "react";
import { sampleListings } from "../data/sampleListings";
import { ListingGrid } from "../components/ListingGrid";
import "../styles/HomePage.css";

const Header = () => (
  <header className="header">
    <span className="logo">SecureTrust</span>
    <div className="header-actions">
      <input className="search-bar" placeholder="🔍  Search for anything..." />
      <div className="user-actions">Login · Signup</div>
    </div>
  </header>
);

const HeroBanner = () => (
  <section className="hero">
    <div className="hero-content">
      <div className="hero-text">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Escrow-Protected Shopping
        </div>
        <h1>
          Discover &amp; Buy<br />
          <span>Trusted Products</span>
        </h1>
        <p>The safest marketplace for buying and selling electronics, fashion,
          and collectibles — protected by smart escrow at every step.</p>
        <button className="primary-btn">Shop Now →</button>
      </div>

      <div className="hero-visuals">
        <div className="hero-float hero-float--a">📷</div>
        <div className="hero-float hero-float--b">📱</div>
        <div className="hero-float hero-float--c">🎧</div>
        <div className="hero-float hero-float--d">👟</div>
        <div className="hero-glow" />
      </div>
    </div>
  </section>
);

// Trust stats shown below the hero
const StatsStrip = () => (
  <div className="stats-strip">
    {[
      { value: "2.4M+",     label: "Active Listings" },
      { value: "98.7%",     label: "Buyer Satisfaction" },
      { value: "$0 Fraud",  label: "Escrow-Backed Guarantee" },
      { value: "140+",      label: "Countries Served" },
    ].map(({ value, label }) => (
      <div key={label} className="stat-item">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    ))}
  </div>
);

const CategoryChips = () => (
  <section className="category-chips">
    {["All", "Electronics", "Services", "Furniture", "Books", "Fashion", "Gaming"].map((cat) => (
      <button key={cat} className="chip">{cat}</button>
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
      <StatsStrip />
      <CategoryChips />
      <h2 className="section-title">New Listings</h2>
      <ListingGrid items={sampleListings} myListings={false} />
      <Footer />
    </div>
  );
};