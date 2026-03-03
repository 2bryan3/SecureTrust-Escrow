// src/components/UploadImages.tsx
import React, { useRef, useState } from "react";
import "../styles/UploadImages.css";

interface UploadImagesProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}

export const UploadImages: React.FC<UploadImagesProps> = ({
  files,
  onFilesSelected,
  onRemoveFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    onFilesSelected(Array.from(e.target.files));
    // reset input so same file can be re-added if removed
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (dropped.length) onFilesSelected(dropped);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  return (
    <div className="upload-wrapper">
      <label className="upload-label">Images</label>

      {/* Drop zone */}
      <div
        className={`upload-dropzone ${dragging ? "upload-dropzone--active" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-icon">📁</div>
        <p className="upload-hint">
          Drag & drop images here, or <span className="upload-browse">browse</span>
        </p>
        <p className="upload-sub">PNG, JPG, WEBP up to 10MB each</p>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="upload-preview-grid">
          {files.map((file, index) => (
            <div key={index} className="upload-preview-item">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="upload-preview-img"
              />
              <button
                className="upload-preview-remove"
                onClick={() => onRemoveFile(index)}
                title="Remove"
              >
                ✕
              </button>
              <div className="upload-preview-name">{file.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};