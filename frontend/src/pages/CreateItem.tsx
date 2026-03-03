// src/pages/CreateItem.tsx
import React, { useState, useRef, useEffect } from "react";
import { NavBar } from "../components/Navbar";
import { UploadImages } from "../components/UploadImages";
import { ToastPortal } from "../components/ToastPortal";
import type { ListingInput } from "../types/listing.types";
import { Footer } from "../components/Footer";
import "../styles/CreateItem.css";

// ── Category definitions ──────────────────────────────────────────────────────
type FieldType = "text" | "number" | "select";

interface CategoryField {
  label: string;
  key: string;
  type: FieldType;
  options?: string[]; // only for select type
  placeholder?: string;
}

const categoryFields: Record<string, CategoryField[]> = {
  Vehicles: [
    { label: "Make", key: "make", type: "text", placeholder: "e.g. Toyota" },
    { label: "Model", key: "model", type: "text", placeholder: "e.g. Camry" },
    { label: "Year", key: "year", type: "number", placeholder: "e.g. 2020" },
    { label: "Mileage", key: "mileage", type: "number", placeholder: "e.g. 45000" },
    {
      label: "Condition",
      key: "condition",
      type: "select",
      options: ["New", "Like New", "Good", "Fair", "Poor"],
    },
    { label: "Color", key: "color", type: "text", placeholder: "e.g. Black" },
    {
      label: "Transmission",
      key: "transmission",
      type: "select",
      options: ["Automatic", "Manual", "CVT"],
    },
    {
      label: "Fuel Type",
      key: "fuelType",
      type: "select",
      options: ["Gasoline", "Diesel", "Electric", "Hybrid"],
    },
  ],
  Electronics: [
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Sony" },
    { label: "Model", key: "model", type: "text", placeholder: "e.g. WH-1000XM5" },
    {
      label: "Condition",
      key: "condition",
      type: "select",
      options: ["New", "Like New", "Good", "Fair", "Poor"],
    },
    { label: "Storage / Specs", key: "specs", type: "text", placeholder: "e.g. 256GB, 16GB RAM" },
    {
      label: "Includes Original Box",
      key: "originalBox",
      type: "select",
      options: ["Yes", "No"],
    },
  ],
  Fashion: [
    { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Nike" },
    { label: "Size", key: "size", type: "text", placeholder: "e.g. M, 10, 32x30" },
    { label: "Color", key: "color", type: "text", placeholder: "e.g. Black" },
    {
      label: "Condition",
      key: "condition",
      type: "select",
      options: ["New with tags", "New without tags", "Like New", "Good", "Fair"],
    },
    {
      label: "Gender",
      key: "gender",
      type: "select",
      options: ["Men", "Women", "Unisex", "Kids"],
    },
  ],
  Furniture: [
    { label: "Material", key: "material", type: "text", placeholder: "e.g. Wood, Metal" },
    { label: "Dimensions", key: "dimensions", type: "text", placeholder: "e.g. 60x30x45 inches" },
    { label: "Color", key: "color", type: "text", placeholder: "e.g. Walnut" },
    {
      label: "Condition",
      key: "condition",
      type: "select",
      options: ["New", "Like New", "Good", "Fair", "Poor"],
    },
    {
      label: "Assembly Required",
      key: "assembly",
      type: "select",
      options: ["Yes", "No"],
    },
  ],
  Books: [
    { label: "Author", key: "author", type: "text", placeholder: "e.g. J.R.R. Tolkien" },
    { label: "ISBN", key: "isbn", type: "text", placeholder: "e.g.  978-0358653035" },
    {
      label: "Condition",
      key: "condition",
      type: "select",
      options: ["New", "Like New", "Good", "Acceptable"],
    },
    {
      label: "Edition",
      key: "edition",
      type: "text",
      placeholder: "e.g. 1st Edition",
    },
    {
      label: "Genre",
      key: "genre",
      type: "select",
      options: ["Fiction", "Non-Fiction", "Textbook", "Comics", "Children", "Other"],
    },
  ],
  Gaming: [
    { label: "Platform", key: "platform", type: "select", options: ["PS5", "PS4", "Xbox Series X", "Xbox One", "Nintendo Switch", "PC", "Other"] },
    { label: "Publisher", key: "publisher", type: "text", placeholder: "e.g. EA, Activision" },
    {
      label: "Condition",
      key: "condition",
      type: "select",
      options: ["New", "Like New", "Good", "Fair", "Poor"],
    },
    {
      label: "Includes Original Case",
      key: "originalCase",
      type: "select",
      options: ["Yes", "No", "Digital Copy"],
    },
  ],
  Services: [
    {
      label: "Service Type",
      key: "serviceType",
      type: "select",
      options: ["Repair", "Cleaning", "Tutoring", "Design", "Photography", "Other"],
    },
    { label: "Location / Remote", key: "location", type: "text", placeholder: "e.g. Miami, FL or Remote" },
    { label: "Availability", key: "availability", type: "text", placeholder: "e.g. Weekends, Mon-Fri 9-5" },
    { label: "Experience", key: "experience", type: "text", placeholder: "e.g. 5 years" },
  ],
};

const allCategories = Object.keys(categoryFields);

// ── Component ─────────────────────────────────────────────────────────────────
export const CreateItem = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear attributes that no longer belong to selected categories
  useEffect(() => {
    const validKeys = selectedCategories.flatMap(
      (cat) => categoryFields[cat]?.map((f) => f.key) ?? []
    );
    setAttributes((prev) => {
      const next: Record<string, string> = {};
      validKeys.forEach((k) => { if (prev[k]) next[k] = prev[k]; });
      return next;
    });
  }, [selectedCategories]);

  const handleAddFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const filesToBase64 = (files: File[]): Promise<string[]> =>
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );

  const handleAttributeChange = (key: string, value: string) => {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      const priceValue = Number(price);
      const images = await filesToBase64(files);

      const listingData: ListingInput = {
        title,
        price: priceValue,
        description,
        categories: selectedCategories,
        images,
        // attributes, // uncomment when backend supports it
      };

      // TODO: Wire up API
      // await axios.post(`${import.meta.env.VITE_API_URL}/listings/create`, listingData, { withCredentials: true });

      setToast({ message: "Listing created successfully!", type: "success" });
      setTitle("");
      setPrice("");
      setSelectedCategories([]);
      setDescription("");
      setFiles([]);
      setAttributes({});
    } catch (err: any) {
      setToast({ message: "Failed to create listing", type: "error" });
      console.error(err);
    }
  };

  // Deduplicate fields when multiple categories share keys (e.g. "condition")
  const dynamicFields = (() => {
    const seen = new Set<string>();
    return selectedCategories.flatMap((cat) =>
      (categoryFields[cat] ?? []).filter((f) => {
        if (seen.has(f.key)) return false;
        seen.add(f.key);
        return true;
      })
    );
  })();

  return (
    <>
      <ToastPortal toast={toast} onClose={() => setToast(null)} />
      <NavBar />

      <main className="cl-main">
        <div className="cl-page">
          <h1 className="cl-title">Create a New Listing</h1>

          <div className="cl-form-container">

            {/* Title */}
            <div className="cl-field">
              <label>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sony WH-1000XM5 Headphones"
              />
            </div>

            {/* Price */}
            <div className="cl-field">
              <label>Price</label>
              <div className="cl-price-wrap">
                <span className="cl-price-symbol">$</span>
                <input
                  className="cl-price-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="cl-field">
              <label>Categories</label>
              <div className="cl-multiselect" ref={dropdownRef}>
                <div
                  className="cl-multiselect-input"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  <div className="cl-selected-tags">
                    {selectedCategories.length === 0 ? (
                      <span className="cl-placeholder">Select a category...</span>
                    ) : (
                      selectedCategories.map((cat) => (
                        <span key={cat} className="cl-tag">
                          {cat}
                          <button
                            type="button"
                            className="cl-tag-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategories((prev) => prev.filter((c) => c !== cat));
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <span className="cl-dropdown-arrow">{dropdownOpen ? "▲" : "▼"}</span>
                </div>

                {dropdownOpen && (
                  <div className="cl-dropdown-menu">
                    {allCategories.map((cat) => (
                      <label key={cat} className="cl-dropdown-item">
                        <input
                          type="radio"
                          checked={selectedCategories.includes(cat)}
                          onChange={() =>
                            setSelectedCategories((prev) =>
                              prev.includes(cat)
                                ? []
                                : [cat]
                            )
                          }
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic category-specific fields */}
            {dynamicFields.length > 0 && (
              <div className="cl-dynamic-section">
                <div className="cl-dynamic-title">Item Details</div>
                <div className="cl-dynamic-grid">
                  {dynamicFields.map((field) => (
                    <div key={field.key} className="cl-field">
                      <label>{field.label}</label>
                      {field.type === "select" ? (
                        <select
                          value={attributes[field.key] || ""}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                        >
                          <option value="">Select {field.label}...</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={attributes[field.key] || ""}
                          placeholder={field.placeholder}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="cl-field">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item — condition, reason for selling, any extras included…"
                rows={5}
              />
            </div>

            {/* Images */}
            <UploadImages
              files={files}
              onFilesSelected={handleAddFiles}
              onRemoveFile={handleRemoveFile}
            />

            {/* Submit */}
            <button className="cl-submit-btn" onClick={handleSubmit}>
              Submit Listing
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};