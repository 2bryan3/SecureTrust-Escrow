// src/components/Footer.tsx
import React from "react";
import "../styles/Footer.css";

type FooterProps = {
  text?: string;
};

export const Footer: React.FC<FooterProps> = ({
  text = "© 2026 SecureTrust Escrow App. All rights reserved.",
}) => {
  return (
    <footer className="footer">
      <p>{text}</p>
    </footer>
  );
};