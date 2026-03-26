// backend/routes/listing.router.js
import express from "express";
import {
  createListing,
  getListing,
  getListings,
  getListingCategories,
  searchListings,
  updateListing,
  deleteListing,
  updateFavorite,
  getFavorite,
  getMyListings,
  getMyFavorites,
} from "../controllers/listing.controller";
import protectRoute from "../utils/protectRoute";

const listingRouter = express.Router();

// Public — specific routes FIRST
listingRouter.get("/categories", getListingCategories);
listingRouter.get("/search", searchListings);
listingRouter.get("/mine", protectRoute, getMyListings);
listingRouter.get("/favorites", protectRoute, getMyFavorites);
listingRouter.get("/:id", getListing);
listingRouter.get("", getListings);

// Protected
listingRouter.post("/create", protectRoute, createListing);
listingRouter.post("/update", protectRoute, updateListing);
listingRouter.post("/delete", protectRoute, deleteListing);
listingRouter.post("/favorite/:id", protectRoute, updateFavorite);
listingRouter.get("/favorite/:id", protectRoute, getFavorite);

export default listingRouter;