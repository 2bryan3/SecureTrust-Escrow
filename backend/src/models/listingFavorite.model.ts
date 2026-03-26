import mongoose from "mongoose";

const ListingFavoritesSchema = new mongoose.Schema({
    listingID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, {versionKey: false , collection: "listingfavorites"});

export const ListingFavorites= mongoose.model("ListingFavorites", ListingFavoritesSchema);