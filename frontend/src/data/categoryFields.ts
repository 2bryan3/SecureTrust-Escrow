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
};

export const allCategories = Object.keys(categoryFields);