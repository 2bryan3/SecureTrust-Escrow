import mongoose from "mongoose";

const ListingReportSchema = new mongoose.Schema({
    reporterID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listingID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Reviewed", "Resolved"],
        default: "Pending"
    }
}, { versionKey: false, timestamps: true, collection: "listingReports" });

export const ListingReport = mongoose.model("ListingReport", ListingReportSchema);