import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/NavBar.css";
import { UserAvatar } from "./UserAvatar";

type NavbarProps = { logo?: string };

export const NavBar: React.FC<NavbarProps> = ({ logo = "SecureTrust" }) => {
  const { user, loading } = useAuth();

  return (
    <header className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo">{logo}</Link>

      <div className="navbar-center">
        <nav className="navbar-links">
          <Link to="/popular">Popular Now</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/deals">Deals</Link>
          <Link to="/create">Sell</Link>
        </nav>
      </div>

      <div className="navbar-actions">
        <input
          className="navbar-search"
          placeholder="🔍  Search for anything..."
        />

        <div className="navbar-auth">
          {loading ? (
            <span>Loading...</span>
          ) : user ? (
            <UserAvatar />
          ) : (
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