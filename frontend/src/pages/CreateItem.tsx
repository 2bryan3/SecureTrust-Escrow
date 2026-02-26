// src/pages/CreateItem.tsx
import React, { useState, useRef, useEffect } from "react";
import { NavBar } from "../components/Navbar";
import { UploadImages } from "../components/UploadImages";
import { ToastPortal } from "../components/ToastPortal";
import type { ListingInput } from "../types/listing.types";
import { Footer } from "../components/Footer";
import "../styles/CreateItem.css";

console.log("CreateItem rendered");

export const CreateItem = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Ref for closing dropdown when clicking outside
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

  useEffect(() => {
    // TODO: Replace with real API call — setCategories(data)
    try {
      const defaultCategories = [
        "Electronics",
        "Services",
        "Furniture",
        "Books",
        "Fashion",
        "Gaming",
      ];
      setCategories(defaultCategories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const filesToBase64 = (files: File[]): Promise<string[]> => {
    return Promise.all(
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
      };

      // TODO: Wire up API
      // const res = await axios.post(
      //   `${import.meta.env.VITE_API_URL}/listings/create`,
      //   listingData,
      //   { withCredentials: true }
      // );

      setToast({ message: "Listing created successfully!", type: "success" });

      // Reset form
      setTitle("");
      setPrice("");
      setSelectedCategories([]);
      setDescription("");
      setFiles([]);
    } catch (err: any) {
      setToast({ message: "Failed to create listing", type: "error" });
      console.error(err);
    }
  };

  return (
    <>
      <ToastPortal toast={toast} onClose={() => setToast(null)} />
      <NavBar />

      {loading ? (
        <div className="cl-loading">Loading...</div>
      ) : error ? (
        <div className="cl-error">Error: {error}</div>
      ) : (
        <main className="cl-main">
          <div className="cl-page">
            <h1 className="cl-title">Create a New Listing</h1>

            <div className="cl-form-container">

              <div className="cl-field">
                <label>Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5 Headphones"
                />
              </div>

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

              <div className="cl-field">
                <label>Categories</label>
                <div className="cl-multiselect" ref={dropdownRef}>
                  <div
                    className="cl-multiselect-input"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                  >
                    <div className="cl-selected-tags">
                      {selectedCategories.length === 0 ? (
                        <span className="cl-placeholder">Select categories...</span>
                      ) : (
                        selectedCategories.map((cat) => (
                          <span key={cat} className="cl-tag">
                            {cat}
                            <button
                              type="button"
                              className="cl-tag-remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCategories((prev) =>
                                  prev.filter((c) => c !== cat)
                                );
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
                      {categories.map((cat) => (
                        <label key={cat} className="cl-dropdown-item">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat)}
                            onChange={() =>
                              setSelectedCategories((prev) =>
                                prev.includes(cat)
                                  ? prev.filter((c) => c !== cat)
                                  : [...prev, cat]
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

              <div className="cl-field">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your item — brand, model, any defects, reason for selling…"
                  rows={5}
                />
              </div>

              <div className="cl-upload-wrapper">
                <UploadImages
                  files={files}
                  onFilesSelected={handleAddFiles}
                  onRemoveFile={handleRemoveFile}
                />
              </div>

              <button className="cl-submit-btn" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        </main>
      )}

      <Footer />
    </>
  );
};