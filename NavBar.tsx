// src/components/Navbar.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/NavBar.css";

type NavbarProps = {
  logo?: string;
};

export const NavBar: React.FC<NavbarProps> = ({ logo = "SecureTrust" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        {logo}
      </Link>

      <div className="navbar-center">
        <nav className="navbar-links">
          <Link to="/popular">Popular Now</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/deals">Deals</Link>
          <Link to="/create">Sell</Link>
          <Link to="/Profile">Profile</Link>
        </nav>
      </div>

      <div className="navbar-actions">
        <input
          className="navbar-search"
          placeholder="🔍  Search for anything..."
        />

        <div className="navbar-auth">
          {!user ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </>
          ) : (
            <>
              <span style={{ marginRight: "8px" }}>
                {user.email}
              </span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};