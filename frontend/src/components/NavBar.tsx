import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/NavBar.css";
import { UserAvatar } from "./UserAvatar";

type NavbarProps = { logo?: string };

export const NavBar: React.FC<NavbarProps> = ({ logo = "SecureTrust" }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">{logo}</Link>

      <nav className="navbar-links">
        <span className="nav-link-disabled" title="Coming soon">Popular Now</span>
        <span className="nav-link-disabled" title="Coming soon">Categories</span>
        <span className="nav-link-disabled" title="Coming soon">Deals</span>
        <Link to="/create" className="navbar-sell-link">Sell</Link>
      </nav>

      <div className="navbar-search-wrapper">
        <input
          className="navbar-search"
          placeholder="Search for anything..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
        />
        <button className="navbar-search-btn" onClick={handleSearch}>🔍</button>
      </div>

      <div className="navbar-actions">
        <div className="navbar-auth">
          {loading ? <span>Loading...</span> : user ? <UserAvatar /> : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};