import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/UserAvatar.css";

export const UserAvatar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); // navigate safely after logout
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  // Safe access to initials
  const initials = `${user.firstName?.[0] ?? "?"}${user.lastName?.[0] ?? "?"}`.toUpperCase();

  return (
    <div className="user-avatar-container" ref={ref}>
      <div
        className="user-avatar-circle"
        onClick={() => setOpen((prev) => !prev)}
      >
        {initials}
      </div>

      {open && (
        <div className="user-avatar-dropdown">
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      )}
    </div>
  );
};