import React, { useState, useEffect, useRef } from "react";
import { UploadImages } from "../components/UploadImages";
import { ToastPortal } from "../components/ToastPortal";
import type { ListingData } from "../types/listing.types";
import axios from "axios";
import "../styles/CreateItem.css";

interface Props {
  listingData: ListingData;
  onClose: () => void;
  onSuccess: (updatedData: ListingData) => void;
}

export const EditListingPopup: React.FC<Props> = ({
  listingData,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(listingData.title);
  const [price, setPrice] = useState(listingData.price.toString());
  const [selectedCategories, setSelectedCategories] = useState(
    listingData.categories
  );
  const [description, setDescription] = useState(listingData.description);

  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState(listingData.images);

  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/listings/categories`, {
        withCredentials: true,
      })
      .then((res) => setCategories(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        categories: selectedCategories,
        images: allImages,
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/listings/update`,
        updatedData,
        { withCredentials: true }
      );

      setToast({ message: "Listing updated!", type: "success" });
      onSuccess(updatedData);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ToastPortal toast={toast} onClose={() => setToast(null)} />

      <div className="vl-confirm-overlay" onClick={onClose}>
        <div
          className="edit-popup-box"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="edit-popup-header">
            <h2>Edit Listing</h2>
            <button onClick={onClose}>×</button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
              <input value={price} onChange={(e) => setPrice(e.target.value)} />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <UploadImages
                files={files}
                onFilesSelected={(f) => setFiles((prev) => [...prev, ...f])}
                onRemoveFile={(i) =>
                  setFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
              />

              <button onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};