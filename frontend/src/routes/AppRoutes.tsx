// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { CreateItem } from "../pages/CreateItem";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Profile from "../pages/Profile";
import { ViewListing } from "../pages/ViewListing";
import { MediatorPage } from "../pages/MediatorPage";
import { AdminPage } from "../pages/AdminPage";
import { RequireAuth } from "../context/RequireAuth";
import { useAuth } from "../context/AuthContext";
import { SearchPage } from "../pages/SearchPage";
import { PopularPage } from "../pages/PopularPage";
import { AdvancedSearchPage } from "../pages/AdvanceSearchPage";


// ── Role guards ───────────────────────────────────────────────────────────────
const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const RequireMediatorOrAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "mediator" && user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ── Routes ────────────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/listing/:id" element={<ViewListing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/popular" element={<PopularPage />} />
      <Route path="/search/advanced" element={<AdvancedSearchPage />} />

      {/* Requires login */}
      <Route path="/create" element={
        <RequireAuth><CreateItem /></RequireAuth>
      } />
      <Route path="/profile" element={
        <RequireAuth><Profile /></RequireAuth>
      } />

      {/* Requires mediator or admin */}
      <Route path="/mediator" element={
        <RequireMediatorOrAdmin><MediatorPage /></RequireMediatorOrAdmin>
      } />

      {/* Requires admin */}
      <Route path="/admin" element={
        <RequireAdmin><AdminPage /></RequireAdmin>
      } />
    </Routes>
  );
};

export default AppRoutes;