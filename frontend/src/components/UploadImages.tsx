import React, { useRef } from "react";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    onFilesSelected(Array.from(e.target.files));
  };

  return (
    <div
      style={{
        background: "white",
        padding: "16px",
        borderRadius: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
        position: "relative",
        border: "1px solid #e5e5e5",
      }}
    >
      <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "6px", color: "black" }}>
        Upload Images
      </div>
      {files.length > 0 ? (
        <div style={{ fontSize: "14px", color: "#555", marginBottom: "10px" }}>
          {files.map((file, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <span>{file.name}</span>
              <button
                onClick={() => onRemoveFile(index)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: "#333",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#888", marginBottom: "12px" }}>
          No images uploaded.
        </div>
      )}

      <button
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "6px 14px",
          borderRadius: "8px",
          backgroundColor: "#f3f3f3",
          border: "1px solid #c7c7c7",
          cursor: "pointer",
        }}
      >
        Browse
      </button>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
};