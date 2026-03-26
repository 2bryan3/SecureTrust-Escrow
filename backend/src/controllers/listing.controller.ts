import {Request, Response} from "express";
import {Listing} from "../models/listing.model";
import { Category } from "../models/categories.model";
import mongoose from "mongoose";
import { ListingInputSchema } from "../schemas/listing.schema";
import { ListingImage } from "../models/listingImage.model"
import { CategoryInputSchema } from "../schemas/category.schema";
import { ListingCategory } from "../models/listingCategory.model";
import { ListingFavorites } from "../models/listingFavorite.model";
import { ListingReport } from "../models/listingReport.model";
const sortAttributeMap: Record<string, Record<string, 1 | -1>> = {
    newest:   { createdAt: -1 },
    oldest:   { createdAt: 1 },
    maxPrice: { price: -1 },
    minPrice: { price: 1 }
};

// GET /listings/sortBy="newest"&category="Electronics&name="whatever"&user=true
export const getListings = async (req: Request, res: Response) => {
  try {
    const sortBy = (req.query.sortBy as string | undefined) ?? "newest";
    const categoryName = (req.query.category as string | undefined) ?? null;
    const nameSearch = (req.query.name as string | undefined) ?? null;
    const userListings = (req.query.user as string | undefined) ?? null;
    const favoritesOnly = (req.query.favorites as string | undefined) === "true"; // <-- new

    const userID = req.user?._id; // needed for favorites filter

    // if a category filter is provided, fetch its _id first
    let categoryID: mongoose.Types.ObjectId | null = null;
    if (categoryName) {
      const category = await Category.findOne({ name: categoryName }).select("_id");
      if (!category) {
        return res.status(200).json({ listings: [] });
      }
      categoryID = category._id as mongoose.Types.ObjectId;
    }

    // build pipeline
    const pipeline: any[] = [];

    // Initial category links lookup for filtering
    pipeline.push({
    $lookup: {
        from: "listingCategories",
        localField: "_id",
        foreignField: "listingID",
        as: "categoryLinks"
    }
    });

    if (nameSearch) {
    pipeline.push({ $match: { title: { $regex: nameSearch, $options: "i" } } });
    }

    if (userListings) {
    pipeline.push({ $match: { userID } });
    }

    if (categoryID) {
    pipeline.push({ $match: { "categoryLinks.categoryID": categoryID } });
    }

    // Lookup images
    pipeline.push({
    $lookup: { from: "listingImages", localField: "_id", foreignField: "listingID", as: "images" }
    });

    // Lookup categories
    pipeline.push({
    $lookup: { from: "categories", localField: "categoryLinks.categoryID", foreignField: "_id", as: "categoriesData" }
    });

    // Lookup user
    pipeline.push({
    $lookup: {
        from: "users", localField: "userID", foreignField: "_id", as: "user",
        pipeline: [{ $project: { password: 0 } }]
    }
    });

    // Lookup favorites
    if (userID) {
    pipeline.push({
        $lookup: {
        from: "listingfavorites",
        let: { listingId: "$_id" },
        pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$listingID", "$$listingId"] }, { $eq: ["$userID", userID] }] } } }],
        as: "favorites"
        }
    });

    if (favoritesOnly) {
        pipeline.push({ $match: { "favorites.0": { $exists: true } } });
    }
    }

    // Transform
    pipeline.push({
    $addFields: {
        images: { $slice: ["$images.image", 1] },
        categories: "$categoriesData.name",
        user: { $arrayElemAt: ["$user", 0] },
        isFavorited: { $gt: [{ $size: { $ifNull: ["$favorites", []] } }, 0] }
    }
    });

    // Cleanup
    pipeline.push({ $project: { categoryLinks: 0, favorites: 0, categoriesData: 0 } });
    pipeline.push({ $sort: sortAttributeMap[sortBy] });
    const listings = await Listing.aggregate(pipeline);
    return res.status(200).json({ listings });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};


export const deleteListing = async (req: Request, res: Response) => {
  try {
    const listingData = req.body;
    const listingID = listingData._id;

    await Listing.deleteOne({_id: listingID});
    await ListingImage.deleteMany({listingID});
    await ListingCategory.deleteMany({listingID});
    await ListingFavorites.deleteMany({listingID});
    await ListingReport.deleteMany({listingID});

    return res.status(200).json({message: "Deleted successfully"})
  } catch (error: any){
    console.log(error.message);
    return res.status(500).json({message: error.message});
  }
}

// POST /listings/update
export const updateListing = async (req: Request, res: Response) => {
  try {
    const listingData = req.body;

    // if (req.user?._id != listingData.user._id){
    //   return res.status(401).json({message: "Unauthorized access to update listing"})
    // }

    // Update listing
    await Listing.findByIdAndUpdate(
      listingData._id,
      {
        price: listingData.price,
        title: listingData.title,
        description: listingData.description,
        isSold: listingData.isSold,
        attributes: listingData.attributes ?? {},
        updatedAt: new Date()
      }
    );

    const listingID = listingData._id;

    // ============ IMAGES ============
    // Delete all old images
    await ListingImage.deleteMany({ listingID });

    // Add all new images
    const imageDocuments = listingData.images.map((image: string) => ({
      image,
      listingID
    }));
    await ListingImage.insertMany(imageDocuments);

    // ============ CATEGORIES ============
    // Delete all old categories
    await ListingCategory.deleteMany({ listingID });

    // Get category IDs for new categories
    const categories = await Promise.all(
      listingData.categories.map((name: string) => Category.findOne({ name }))
    );

    // Add all new categories
    const categoryDocuments = categories
      .filter(cat => cat !== null) // Filter out any null results
      .map((cat) => ({
        listingID,
        categoryID: cat._id
      }));
    await ListingCategory.insertMany(categoryDocuments);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
}

// GET /listings/:id
export const getListing = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: "Invalid listing ID" });
        }

        const [listing] = await Listing.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(id) } },
        
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
          {
            $lookup: {
              from: "listingImages",
              localField: "_id",
              foreignField: "listingID",
              as: "images"
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "userID",
              foreignField: "_id",
              as: "user",
              pipeline: [
                { $project: { password: 0 } }
              ]
            }
          },
          {
            $addFields: {
              images: "$images.image",
              categories: "$categories.name",
              user: { $arrayElemAt: ["$user", 0] }  // Convert user array to single object
            }
          },
          {
            $project: {
              categoryLinks: 0  // remove intermediate category
            }
          }
        ]);

        if (!listing) 
            return res.status(400).json({error: "Listing not found"})

        return res.status(200).json(listing);
    } catch (err: any){
        res.status(500).json({error: err.message});
    }
}

export const createListing = async (req: Request, res: Response) => {
  try {
    // A listing request should come in req.body with form of 
    // Listing, categories [string], images [string]
    const { categories, images, attributes, ...listingData} = req.body;
    console.log(categories)
    // We don't send the userID from the form data, but we get it from protected route
    listingData.userID = String(req.user?._id);
    listingData.attributes = attributes ?? {};
    const listingInput = ListingInputSchema.parse(listingData);

    const listing = new Listing(listingInput);

    await listing.save(); 

    const listingID = listing._id;

    // Create the image listing documents
    await Promise.all(
      images.map(async (image: string) => {
        const listingImage = new ListingImage({image, listingID});
        await listingImage.save();
      })
    );

    // Create category listing documents
    await Promise.all(
      categories.map(async (categoryName: string) => {
        if (categoryName.trim().length == 0){
          return;
        }
        const category = await Category.findOne({name: categoryName})
        const categoryID = category?._id
        const listingCategory = new ListingCategory({listingID, categoryID})
        await listingCategory.save();
      })
    )

    return res.status(200).json({ id: listing._id });

  } catch (error: any){
    return res.status(500).json({message: error.message});
  }
}

export const getListingCategories = async (_req: Request, res: Response) => {
  try {
    const names = await Category.distinct("name");
    return res.json(names);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

export const addCategory =  async (req: Request, res:Response) => {
  try {
    const name  = req.query.name as string;

    // Validate with Zod
    const parsed = CategoryInputSchema.safeParse({ name });

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues});
    }

    // Create category
    const category = await Category.create(parsed.data);

    return res.status(200).json(category);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

// POST /listings/favorite
export const updateFavorite = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const userID = req.user?._id;
  
    const exists = await ListingFavorites.findOne({ listingID: id, userID });
  
    if (exists) {
      await ListingFavorites.deleteOne({ listingID: id, userID });
    } else {
      await ListingFavorites.create({ userID, listingID: id });
    }
  
    return res.status(200).json({ success: true });
  
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
}

export const getFavorite = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const userID = req.user?._id;
  
    const exists = await ListingFavorites.findOne({ listingID: id, userID });
  
    if (exists) {
      return res.status(200).json({favorite: true});
    } else {
      return res.status(200).json({favorite: false});
    }
  
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
}

export const searchListings = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q) return res.status(200).json({ listings: [] });

    const userID = req.user?._id;

    const pipeline: any[] = [
      // Text search on title first
      { $match: { title: { $regex: q, $options: "i" } } },

      // Join category links
      { $lookup: { from: "listingCategories", localField: "_id", foreignField: "listingID", as: "categoryLinks" } },

      // Join category names
      { $lookup: { from: "categories", localField: "categoryLinks.categoryID", foreignField: "_id", as: "categoriesData" } },

      // Join images
      { $lookup: { from: "listingImages", localField: "_id", foreignField: "listingID", as: "images" } },

      // Join user
      { $lookup: { from: "users", localField: "userID", foreignField: "_id", as: "user",
          pipeline: [{ $project: { password: 0 } }]
      }},

      // Filter by category name if it matches query too
      // (listings whose category name matches are also included via $or)
      {
        $match: {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { "categoriesData.name": { $regex: q, $options: "i" } }
          ]
        }
      },
    ];

    // Favorites if logged in
    if (userID) {
      pipeline.push({
        $lookup: {
          from: "listingfavorites",
          let: { listingId: "$_id" },
          pipeline: [{ $match: { $expr: { $and: [
            { $eq: ["$listingID", "$$listingId"] },
            { $eq: ["$userID", userID] }
          ]}}}],
          as: "favorites"
        }
      });
    }

    pipeline.push({
      $addFields: {
        images: { $slice: ["$images.image", 1] },
        categories: "$categoriesData.name",
        user: { $arrayElemAt: ["$user", 0] },
        isFavorited: { $gt: [{ $size: { $ifNull: ["$favorites", []] } }, 0] }
      }
    });

    pipeline.push({ $project: { categoryLinks: 0, favorites: 0, categoriesData: 0 } });
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $limit: 50 });

    const listings = await Listing.aggregate(pipeline);
    return res.status(200).json({ listings });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const getMyListings = async (req: Request, res: Response) => {
  try {
    const userID = req.user?._id;
    const pipeline: any[] = [
      { $match: { userID } },
      { $lookup: { from: "listingCategories", localField: "_id", foreignField: "listingID", as: "categoryLinks" }},
      { $lookup: { from: "categories", localField: "categoryLinks.categoryID", foreignField: "_id", as: "categoriesData" }},
      { $lookup: { from: "listingImages", localField: "_id", foreignField: "listingID", as: "images" }},
      { $lookup: { from: "users", localField: "userID", foreignField: "_id", as: "user", pipeline: [{ $project: { password: 0 } }] }},
      { $lookup: {
          from: "listingfavorites",
          let: { listingId: "$_id" },
          pipeline: [{ $match: { $expr: { $and: [
            { $eq: ["$listingID", "$$listingId"] },
            { $eq: ["$userID", userID] }
          ]}}}],
          as: "favorites"
      }},
      { $addFields: {
          images: { $slice: ["$images.image", 1] },
          categories: "$categoriesData.name",
          user: { $arrayElemAt: ["$user", 0] },
          isFavorited: { $gt: [{ $size: { $ifNull: ["$favorites", []] } }, 0] }
      }},
      { $project: { categoryLinks: 0, categoriesData: 0, favorites: 0 }},
      { $sort: { createdAt: -1 }}
    ];
    const listings = await Listing.aggregate(pipeline);
    return res.status(200).json({ listings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getMyFavorites = async (req: Request, res: Response) => {
  try {
    const userID = req.user?._id;
    const pipeline: any[] = [
      { $lookup: { from: "listingCategories", localField: "_id", foreignField: "listingID", as: "categoryLinks" }},
      { $lookup: { from: "categories", localField: "categoryLinks.categoryID", foreignField: "_id", as: "categoriesData" }},
      { $lookup: { from: "listingImages", localField: "_id", foreignField: "listingID", as: "images" }},
      { $lookup: { from: "users", localField: "userID", foreignField: "_id", as: "user", pipeline: [{ $project: { password: 0 } }] }},
      { $lookup: {
          from: "listingfavorites",
          let: { listingId: "$_id" },
          pipeline: [{ $match: { $expr: { $and: [
            { $eq: ["$listingID", "$$listingId"] },
            { $eq: ["$userID", userID] }
          ]}}}],
          as: "favorites"
      }},
      { $match: { "favorites.0": { $exists: true } }},
      { $addFields: {
          images: { $slice: ["$images.image", 1] },
          categories: "$categoriesData.name",
          user: { $arrayElemAt: ["$user", 0] },
          isFavorited: true
      }},
      { $project: { categoryLinks: 0, categoriesData: 0, favorites: 0 }},
      { $sort: { createdAt: -1 }}
    ];
    const listings = await Listing.aggregate(pipeline);
    return res.status(200).json({ listings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};