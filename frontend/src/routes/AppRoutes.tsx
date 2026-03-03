import React from "react";
import { Routes, Route } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { CreateItem } from "../pages/CreateItem";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
//import { RequireAuth } from "../context/RequireAuth";
import Profile from "../pages/Profile";
import { ViewListing } from "../pages/ViewListing";
import { MediatorPage } from "../pages/MediatorPage";
import { AdminPage } from "../pages/AdminPage";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreateItem />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/listing/:id" element={<ViewListing />} />
      <Route path="/mediator" element={<MediatorPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
};

export default AppRoutes;