export type FieldType = "text" | "number" | "select";
export interface CategoryField {
  label: string;
  key: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
}
export const categoryFields: Record<string, CategoryField[]> = {
  Vehicles: [
    { label: "Make", key: "make", type: "text", placeholder: "e.g. Toyota" },
    { label: "Model", key: "model", type: "text", placeholder: "e.g. Camry" },
    { label: "Year", key: "year", type: "number", placeholder: "e.g. 2020" },
    { label: "Mileage", key: "mileage", type: "number", placeholder: "e.g. 45000" },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair", "Poor"] },
    { label: "Color", key: "color", type: "text", placeholder: "e.g. Black" },
    { label: "Transmission", key: "transmission", type: "select", options: ["Automatic", "Manual", "CVT"] },
    { label: "Fuel Type", key: "fuelType", type: "select", options: ["Gasoline", "Diesel", "Electric", "Hybrid"] },
  ],
  Electronics: [
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Sony" },
    { label: "Model", key: "model", type: "text", placeholder: "e.g. WH-1000XM5" },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair", "Poor"] },
    { label: "Storage / Specs", key: "specs", type: "text", placeholder: "e.g. 256GB, 16GB RAM" },
    { label: "Includes Original Box", key: "originalBox", type: "select", options: ["Yes", "No"] },
  ],
  Fashion: [
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Nike" },
    { label: "Size", key: "size", type: "text", placeholder: "e.g. M, 10, 32x30" },
    { label: "Color", key: "color", type: "text", placeholder: "e.g. Black" },
    { label: "Condition", key: "condition", type: "select", options: ["New with tags", "New without tags", "Like New", "Good", "Fair"] },
    { label: "Gender", key: "gender", type: "select", options: ["Men", "Women", "Unisex", "Kids"] },
  ],
  Furniture: [
    { label: "Material", key: "material", type: "text", placeholder: "e.g. Wood, Metal" },
    { label: "Dimensions", key: "dimensions", type: "text", placeholder: "e.g. 60x30x45 inches" },
    { label: "Color", key: "color", type: "text", placeholder: "e.g. Walnut" },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair", "Poor"] },
    { label: "Assembly Required", key: "assembly", type: "select", options: ["Yes", "No"] },
  ],
  Books: [
    { label: "Author", key: "author", type: "text", placeholder: "e.g. J.R.R. Tolkien" },
    { label: "ISBN", key: "isbn", type: "text", placeholder: "e.g. 978-0358653035" },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Acceptable"] },
    { label: "Edition", key: "edition", type: "text", placeholder: "e.g. 1st Edition" },
    { label: "Genre", key: "genre", type: "select", options: ["Fiction", "Non-Fiction", "Textbook", "Comics", "Children", "Other"] },
  ],
  Gaming: [
    { label: "Platform", key: "platform", type: "select", options: ["PS5", "PS4", "Xbox Series X", "Xbox One", "Nintendo Switch", "PC", "Other"] },
    { label: "Publisher", key: "publisher", type: "text", placeholder: "e.g. EA, Activision" },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair", "Poor"] },
    { label: "Includes Original Case", key: "originalCase", type: "select", options: ["Yes", "No", "Digital Copy"] },
  ],
  Services: [
    { label: "Service Type", key: "serviceType", type: "select", options: ["Repair", "Cleaning", "Tutoring", "Design", "Photography", "Other"] },
    { label: "Location / Remote", key: "location", type: "text", placeholder: "e.g. Miami, FL or Remote" },
    { label: "Availability", key: "availability", type: "text", placeholder: "e.g. Weekends, Mon-Fri 9-5" },
    { label: "Experience", key: "experience", type: "text", placeholder: "e.g. 5 years" },
  ],
  "Collectibles & Art": [
    { label: "Type", key: "type", type: "select", options: ["Art", "Trading Cards", "Coins", "Stamps", "Memorabilia", "Antiques", "Other"] },
    { label: "Condition", key: "condition", type: "select", options: ["Mint", "Near Mint", "Good", "Fair", "Poor"] },
    { label: "Era / Period", key: "era", type: "text", placeholder: "e.g. 1990s, Victorian" },
    { label: "Authenticity Certificate", key: "certificate", type: "select", options: ["Yes", "No"] },
  ],
  "Home & Garden": [
    { label: "Type", key: "type", type: "select", options: ["Appliance", "Decor", "Garden", "Lighting", "Storage", "Other"] },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair", "Poor"] },
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Dyson, IKEA" },
  ],
  "Toys & Hobbies": [
    { label: "Age Range", key: "ageRange", type: "select", options: ["0-2", "3-5", "6-12", "13+", "Adult"] },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair", "Poor"] },
    { label: "Type", key: "type", type: "select", options: ["Action Figure", "Board Game", "Puzzle", "RC", "LEGO", "Doll", "Other"] },
    { label: "Includes All Parts", key: "complete", type: "select", options: ["Yes", "No", "Unknown"] },
  ],
  "Sporting Goods": [
    { label: "Sport", key: "sport", type: "text", placeholder: "e.g. Basketball, Golf" },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair", "Poor"] },
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Nike, Callaway" },
    { label: "Size", key: "size", type: "text", placeholder: "e.g. Large, 42" },
  ],
  "Health & Beauty": [
    { label: "Type", key: "type", type: "select", options: ["Skincare", "Haircare", "Makeup", "Supplements", "Equipment", "Other"] },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Open Box"] },
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. L'Oreal, Vitamix" },
  ],
  "Jewelry & Watches": [
    { label: "Type", key: "type", type: "select", options: ["Ring", "Necklace", "Bracelet", "Earrings", "Watch", "Other"] },
    { label: "Material", key: "material", type: "select", options: ["Gold", "Silver", "Platinum", "Stainless Steel", "Other"] },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair"] },
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Rolex, Pandora" },
  ],
  "Baby Essentials": [
    { label: "Type", key: "type", type: "select", options: ["Clothing", "Gear", "Feeding", "Toys", "Furniture", "Other"] },
    { label: "Age Range", key: "ageRange", type: "select", options: ["Newborn", "0-6 months", "6-12 months", "1-2 years", "2-4 years"] },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair"] },
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Graco, Chicco" },
  ],
  "Pet Supplies": [
    { label: "Pet Type", key: "petType", type: "select", options: ["Dog", "Cat", "Bird", "Fish", "Reptile", "Small Animal", "Other"] },
    { label: "Type", key: "type", type: "select", options: ["Food", "Toys", "Accessories", "Habitat", "Grooming", "Other"] },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good"] },
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Purina, Kong" },
  ],
  "Musical Instruments": [
    { label: "Instrument", key: "instrument", type: "text", placeholder: "e.g. Guitar, Piano" },
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Fender, Yamaha" },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair", "Poor"] },
    { label: "Includes Case", key: "includesCase", type: "select", options: ["Yes", "No"] },
  ],
  "Tools & Hardware": [
    { label: "Type", key: "type", type: "select", options: ["Power Tools", "Hand Tools", "Measuring", "Safety", "Other"] },
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. DeWalt, Milwaukee" },
    { label: "Condition", key: "condition", type: "select", options: ["New", "Like New", "Good", "Fair", "Poor"] },
    { label: "Corded / Cordless", key: "power", type: "select", options: ["Corded", "Cordless", "N/A"] },
  ],
  Livestock: [
    { label: "Animal Type", key: "animalType", type: "select", options: ["Horse", "Cattle", "Goat", "Sheep", "Pig", "Poultry", "Other"] },
    { label: "Breed", key: "breed", type: "text", placeholder: "e.g. Quarter Horse, Angus" },
    { label: "Age", key: "age", type: "text", placeholder: "e.g. 3 years" },
    { label: "Gender", key: "gender", type: "select", options: ["Male", "Female", "Neutered Male"] },
    { label: "Registered", key: "registered", type: "select", options: ["Yes", "No"] },
    { label: "Location", key: "location", type: "text", placeholder: "e.g. Albany, NY" },
  ],
};

export const allCategories = Object.keys(categoryFields);