import express , {Request, Response }from "express";
import { ListingReport } from "../models/listingReport.model"; // Adjust path
import protectRoute from "../utils/protectRoute";
import mongoose from "mongoose";
const reportRouter = express.Router();

// Create a new listing report
reportRouter.post("/", protectRoute, async (req, res) => {
    try {
        const { listingID, reason } = req.body;
        const reporterID = req.user?._id;

        const report = new ListingReport({ reporterID, listingID, reason });
        await report.save();

        res.status(201).json({ message: "Report submitted successfully", report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});



// Get all listing reports
reportRouter.get("/", protectRoute, async (req: Request, res: Response) => {
    try {
      const reports = await ListingReport.aggregate([
        {
          $sort: { createdAt: -1 } // latest first
        },
        // Join User (reporter)
        {
          $lookup: {
            from: "users",
            localField: "reporterID",
            foreignField: "_id",
            as: "user",
            pipeline: [{ $project: { password: 0 } }]
          }
        },
        {
          $addFields: {
            user: { $arrayElemAt: ["$user", 0] } // convert array to object
          }
        },
        // Join Listing with full details
        {
          $lookup: {
            from: "listings",
            localField: "listingID",
            foreignField: "_id",
            as: "listingData",
            pipeline: [
              // Lookup categories
              {
                $lookup: {
                  from: "listingCategories",
                  localField: "_id",
                  foreignField: "listingID",
                  as: "categoryLinks"
                }
              },
              {
                $lookup: {
                  from: "categories",
                  localField: "categoryLinks.categoryID",
                  foreignField: "_id",
                  as: "categories"
                }
              },
              // Lookup images
              {
                $lookup: {
                  from: "listingImages",
                  localField: "_id",
                  foreignField: "listingID",
                  as: "images"
                }
              },
              // Lookup user
              {
                $lookup: {
                  from: "users",
                  localField: "userID",
                  foreignField: "_id",
                  as: "user",
                  pipeline: [{ $project: { password: 0 } }]
                }
              },
              {
                $addFields: {
                  images: "$images.image",
                  categories: "$categories.name",
                  user: { $arrayElemAt: ["$user", 0] }
                }
              },
              { $project: { categoryLinks: 0 } }
            ]
          }
        },
        {
          $addFields: {
            listingData: { $arrayElemAt: ["$listingData", 0] } // convert array to object
          }
        }
      ]);
  
      res.status(200).json(reports);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Get a single listing report by ID
// GET /reports/:id
reportRouter.get("/:id", protectRoute, async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "Invalid report ID" });
      }
  
      const [report] = await ListingReport.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } }, // match single report
        { $sort: { createdAt: -1 } },
  
        // Join User (reporter)
        {
          $lookup: {
            from: "users",
            localField: "reporterID",
            foreignField: "_id",
            as: "user",
            pipeline: [{ $project: { password: 0 } }]
          }
        },
        {
          $addFields: {
            user: { $arrayElemAt: ["$user", 0] } // convert array to object
          }
        },
  
        // Join Listing with full details
        {
          $lookup: {
            from: "listings",
            localField: "listingID",
            foreignField: "_id",
            as: "listingData",
            pipeline: [
              // Lookup categories
              {
                $lookup: {
                  from: "listingCategories",
                  localField: "_id",
                  foreignField: "listingID",
                  as: "categoryLinks"
                }
              },
              {
                $lookup: {
                  from: "categories",
                  localField: "categoryLinks.categoryID",
                  foreignField: "_id",
                  as: "categories"
                }
              },
              // Lookup images
              {
                $lookup: {
                  from: "listingImages",
                  localField: "_id",
                  foreignField: "listingID",
                  as: "images"
                }
              },
              // Lookup user
              {
                $lookup: {
                  from: "users",
                  localField: "userID",
                  foreignField: "_id",
                  as: "user",
                  pipeline: [{ $project: { password: 0 } }]
                }
              },
              {
                $addFields: {
                  images: "$images.image",
                  categories: "$categories.name",
                  user: { $arrayElemAt: ["$user", 0] }
                }
              },
              { $project: { categoryLinks: 0 } }
            ]
          }
        },
        {
          $addFields: {
            listingData: { $arrayElemAt: ["$listingData", 0] } // convert array to object
          }
        }
      ]);
  
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
  
      // Return as ListingReportData
      res.status(200).json({ reportData: report });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  

reportRouter.delete("/:id", protectRoute, async (req, res) => {
    try {
        const report = await ListingReport.findByIdAndDelete(req.params.id);

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.status(200).json({ message: "Report deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update listing report status
reportRouter.post("/:id", protectRoute, async (req, res) => {
    try {
        const { status } = req.body;
        const report = await ListingReport.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!report) return res.status(404).json({ message: "Report not found" });

        res.status(200).json({ message: "Report updated", report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default reportRouter;