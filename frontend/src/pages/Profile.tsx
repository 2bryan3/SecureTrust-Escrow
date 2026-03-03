import React, { useState } from "react";
import { NavBar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "../styles/Profile.css";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

export default function Profile() {
  const { user, setUser: setAuthUser } = useAuth(); // get user from AuthContext
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);

  const togglePassword = () => setHidePassword(!hidePassword);

  if (!user) return <p>Loading...</p>; // wait until AuthContext has user

  // Safe initials
  const initials = `${user.firstName?.[0] ?? "?"}${user.lastName?.[0] ?? "?"}`.toUpperCase();

  const handleSubmit = async () => {
    try {
      const updateData: any = {};
      if (password.trim() !== "") updateData.password = password;

      if (Object.keys(updateData).length === 0) return; // nothing to update

      await axios.put(`${import.meta.env.VITE_API_URL}/user/update`, updateData, {
        withCredentials: true,
      });

      setPassword("");
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  return (
    <>
      <NavBar />
      <main className="profile">
        <div className="profile-page">
          <div className="profile-container">
            {/* Avatar */}
            <div className="profile-pic-initials">{initials}</div>

            {/* Info */}
            <h1 className="profile-name">{user.username}</h1>
            <h2 className="profile-email">{user.email}</h2>
            <h2 className="profile-date">
              Member since {" "}
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
            </h2>
            <h2 className="profile-sales">{user.totalSales || 0} Total Sales</h2>
            <h2 className="profile-rating">Rating: {user.rating || 0} ⭐</h2>

            {/* Password change */}
            <div className="password-change">
              <label>New Password</label>
              <div className="password-field">
                <input
                  type={hidePassword ? "password" : "text"}
                  value={password}
                  placeholder="Leave blank to keep current"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={togglePassword}>
                  {hidePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button className="save-password-btn" onClick={handleSubmit}>Save Password</button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}