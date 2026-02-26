// import React from "react";
// import ReactDOM from "react-dom";
// import { Toast } from "./Toast";

// type PortalProps = {
//   toast: { message: string; type: "success" | "error" } | null;
//   onClose: () => void;
// };

// // export const ToastPortal: React.FC<PortalProps> = ({ toast, onClose }) => {

// //   return <div> Im a Toast </div>
// //   // const root = document.getElementById("toast-root");
// //   // if (!root || !toast) return null;

// //   // return ReactDOM.createPortal(
// //   //   <div className="toast-portal-container">
// //   //     <Toast message={toast.message} type={toast.type} onClose={onClose} />
// //   //   </div>,
// //   //   root
// //   // );
// // };

// src/components/ToastPortal.tsx
import React from "react";
// import ReactDOM from "react-dom";
// import { Toast } from "./Toast";

type PortalProps = {
  toast: { message: string; type: "success" | "error" } | null;
  onClose: () => void;
};

export const ToastPortal: React.FC<PortalProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  // Safe placeholder fallback — just shows message directly
  return <div className="toast-portal-container">{toast.message}</div>;

  /*
  // Original portal code (uncomment once Toast is working)
  const root = document.getElementById("toast-root");
  if (!root) return <div>{toast.message}</div>; 
  return ReactDOM.createPortal(
    <Toast message={toast.message} type={toast.type} onClose={onClose} />,
    root
  );
  */
};