// frontend/src/pages/CreateItem.tsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { NavBar } from "../components/NavBar";
import { UploadImages } from "../components/UploadImages";
import { ToastPortal } from "../components/ToastPortal";
import type { ListingInput } from "../types/listing.types";
import { Footer } from "../components/Footer";
import "../styles/CreateItem.css";
import { categoryFields, allCategories } from "../data/categoryFields";


// ── Component ─────────────────────────────────────────────────────────────────
export const CreateItem = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "local_pickup" | "">("");

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

  const handleAddFiles = (newFiles: File[]) => setFiles((prev) => [...prev, ...newFiles]);
  const handleRemoveFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

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
    if (!title.trim() || !description.trim() || !price || !deliveryMethod) {
      setToast({ message: "Please fill in title, description, price, and delivery method.", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const images = await filesToBase64(files);

      const listingData: ListingInput = {
        title,
        price: Number(price),
        description,
        categories: selectedCategories,
        images,
        attributes,
        deliveryMethod,
      };

      await axios.post(`/api/listings/create`, listingData, {
        withCredentials: true,
      });

      setToast({ message: "Listing created successfully!", type: "success" });
      setTitle("");
      setPrice("");
      setSelectedCategories([]);
      setDescription("");
      setFiles([]);
      setDeliveryMethod("");
      setAttributes({});
    } catch (err: any) {
      const message = err.response?.data?.error ?? "Failed to create listing.";
      setToast({ message, type: "error" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
              <label>Delivery Method</label>
              <div className="cl-radio-group">
                <label className="cl-radio-option">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="shipping"
                    checked={deliveryMethod === "shipping"}
                    onChange={() => setDeliveryMethod("shipping")}
                  />
                  <span>Shipping</span>
                </label>
                <label className="cl-radio-option">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="local_pickup"
                    checked={deliveryMethod === "local_pickup"}
                    onChange={() => setDeliveryMethod("local_pickup")}
                  />
                  <span>Local Pickup</span>
                </label>
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
                              prev.includes(cat) ? [] : [cat]
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

            <div className="cl-field">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item — condition, reason for selling, any extras included…"
                rows={5}
              />
            </div>

            <UploadImages
              files={files}
              onFilesSelected={handleAddFiles}
              onRemoveFile={handleRemoveFile}
            />

            <button
              className="cl-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Listing"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};