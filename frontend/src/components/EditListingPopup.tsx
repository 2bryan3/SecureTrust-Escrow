import React, { useState, useEffect } from "react";
import { UploadImages } from "../components/UploadImages";
import { ToastPortal } from "../components/ToastPortal";
import type { ListingData } from "../types/listing.types";
import axios from "axios";
import "../styles/EditListingPopup.css";
import { categoryFields } from "../data/categoryFields";


interface Props {
  listingData: ListingData;
  onClose: () => void;
  onSuccess: (updatedData: ListingData) => void;
}

export const EditListingPopup: React.FC<Props> = ({ listingData, onClose, onSuccess }) => {
  const [title, setTitle] = useState(listingData.title);
  const [price, setPrice] = useState(listingData.price.toString());
  const [description, setDescription] = useState(listingData.description);
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState(listingData.images);
  const [attributes, setAttributes] = useState<Record<string, string>>(
    listingData.attributes ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<any>(null);

  const dynamicFields = listingData.categories.flatMap(
    (cat) => categoryFields[cat] ?? []
  ).filter((f, i, arr) => arr.findIndex(x => x.key === f.key) === i);

  const filesToBase64 = (files: File[]) =>
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
    setAttributes(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const newImages = await filesToBase64(files);
      const allImages = [...existingImages, ...newImages];

      if (allImages.length < 1) {
        setToast({ message: "At least 1 image required", type: "error" });
        return;
      }

      const updatedData = {
        ...listingData,
        title,
        price: Number(price),
        description,
        images: allImages,
        attributes,
      };

      await axios.post(`/api/listings/update`, updatedData, {
        withCredentials: true,
      });

      setToast({ message: "Listing updated!", type: "success" });
      onSuccess(updatedData);
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to update listing.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ToastPortal toast={toast} onClose={() => setToast(null)} />

      <div className="vl-confirm-overlay" onClick={onClose}>
        <div className="edit-popup-box" onClick={(e) => e.stopPropagation()}>

          <div className="edit-popup-header">
            <h2>Edit Listing</h2>
            <button onClick={onClose}>×</button>
          </div>

          {/* Title */}
          <div className="edit-field">
            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Listing title"
            />
          </div>

          {/* Price */}
          <div className="edit-field">
            <label>Price</label>
            <div className="edit-price-wrap">
              <span className="edit-price-symbol">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="edit-price-input"
              />
            </div>
          </div>

          {/* Description */}
          <div className="edit-field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Attributes */}
          {dynamicFields.length > 0 && (
            <div className="edit-field">
              <label>Item Details</label>
              <div className="edit-attributes-grid">
                {dynamicFields.map((field) => (
                  <div key={field.key} className="edit-attribute-field">
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

          {/* Images */}
          <div className="edit-field">
            <label>Images</label>
            <UploadImages
              files={files}
              onFilesSelected={(f) => setFiles((prev) => [...prev, ...f])}
              onRemoveFile={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
            />
          </div>

          <button className="edit-save-btn" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>

        </div>
      </div>
    </>
  );
};