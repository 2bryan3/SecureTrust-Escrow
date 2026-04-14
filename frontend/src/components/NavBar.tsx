import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConversationContext } from "../context/ConversationContext";
import { UserAvatar } from "./UserAvatar";
import { MessagesPanel } from "./MessagesPanel";
import "../styles/NavBar.css";

type NavbarProps = { logo?: string };

export const NavBar: React.FC<NavbarProps> = ({ logo = "SecureTrust" }) => {
  const { user, loading } = useAuth();
  const { setPanelOpen, unreadCount } = useConversationContext();
  const navigate = useNavigate();
  const [query, setQuery]           = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/listings/categories")
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCategories(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleCategoryClick = (cat: string) => {
    setShowCategories(false);
    navigate(`/search?category=${encodeURIComponent(cat)}`);
  };

  return (
    <>
      <header className="navbar">
        <Link to="/" className="navbar-logo">{logo}</Link>

      <nav className="navbar-links">
        <Link to="/popular" className="navbar-popular-link">Popular Now</Link>

        {/* Categories dropdown */}
        <div className="navbar-categories-wrapper" ref={dropdownRef}>
          <button
            className={`navbar-categories-btn ${showCategories ? "active" : ""}`}
            onClick={() => setShowCategories(prev => !prev)}
          >
            Categories
            <span className={`navbar-categories-caret ${showCategories ? "open" : ""}`}></span>
          </button>

          {showCategories && (
            <div className="navbar-categories-dropdown">
              <div className="navbar-categories-grid">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className="navbar-category-item"
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
        <button className="navbar-search-btn" onClick={handleSearch}>Search</button>
      </div>
      <button
        className="navbar-advsearch-link"
        onClick={() => navigate("/search/advanced")}
      >
        Advanced Search
      </button>

        <div className="navbar-actions">
          {!loading && user && (
            <button
              className="navbar-messages-btn"
              onClick={() => setPanelOpen(true)}
              title="Messages"
              aria-label="Open messages"
            >
              <MessageCircle size={22} />
              {unreadCount > 0 && (
                <span className="navbar-messages-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}
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

      <MessagesPanel />
    </>
  );
};
