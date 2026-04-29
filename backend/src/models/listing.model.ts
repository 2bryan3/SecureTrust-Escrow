import mongoose from "mongoose";


const ListingSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true},
    userID: {type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isSold: {type: Boolean, default: false},
    isLocked: {type: Boolean, default: false},
    isEscalated: {type: Boolean, default: false},
    deliveryMethod: {type: String, enum: ["shipping", "local_pickup"], required: true},
    attributes: {type: mongoose.Schema.Types.Mixed, default: {}},
    location: {
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number],
        },
    },
    // Display location (for frontend)
    street: { type: String },
    city: { type: String },
    state: { type: String },
}, {timestamps: true, versionKey: false})

export const Listing = mongoose.model("Listing", ListingSchema);