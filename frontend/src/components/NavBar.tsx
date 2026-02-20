// src/components/Navbar.tsx
import React from "react";
import "../styles/NavBar.css";

type NavbarProps = {
  logo?: string;
};

export const NavBar: React.FC<NavbarProps> = ({ logo = "SecureTrust" }) => {
  return (
    <header className="navbar">
      <span className="navbar-logo">{logo}</span>
      <div className="navbar-center">
        <nav className="navbar-links">
          <a href="#">Popular Now</a>
          <a href="#">Categories</a>
          <a href="#">Deals</a>
          <a href="#">Sell</a>
        </nav>
      </div>
      <div className="navbar-actions">
        <input className="navbar-search" placeholder="🔍  Search for anything..." />
        <div className="navbar-auth">Login · Signup</div>
      </div>
    </header>
  );
};