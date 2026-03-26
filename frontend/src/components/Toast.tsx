import React, { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

export const Toast: React.FC<ToastProps> = ({ message, type = "success", onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: type === "success" ? "#22c55e" : "#ef4444",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "8px",
      fontWeight: 600,
      fontSize: "0.9rem",
      zIndex: 9999,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.3s, transform 0.3s",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
    }}>
      {message}
    </div>
  );
};