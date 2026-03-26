import mongoose from "mongoose";

const ListingCategorySchema = new mongoose.Schema({
    listingID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    categoryID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
}, {versionKey: false , collection: "listingCategories"});

export const ListingCategory = mongoose.model("ListingCategories", ListingCategorySchema)