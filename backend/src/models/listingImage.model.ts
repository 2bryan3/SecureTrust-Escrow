import mongoose from "mongoose";

const ListingImageSchema = new mongoose.Schema({
    listingID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    image: {type: String, required: true},
}, {versionKey: false , collection: "listingImages"});

export const ListingImage = mongoose.model("ListingImages", ListingImageSchema)