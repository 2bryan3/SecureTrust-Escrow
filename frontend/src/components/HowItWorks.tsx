// src/components/HowItWorks.tsx
import React from "react";
import "../styles/HowItWorks.css";

type Step = {
  num: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
};

const ListIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const EscrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <circle cx="7" cy="15" r="1.2" fill="currentColor" />
  </svg>
);

const ShipIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v7a2 2 0 0 1-2 2h-2" />
    <circle cx="9" cy="20" r="2" />
    <circle cx="18" cy="20" r="2" />
    <path d="M14 3v5h5" />
  </svg>
);

const ReleaseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);

const steps: Step[] = [
  {
    num: "01",
    title: "List your item",
    desc: "Create a listing with photos, price, and delivery details.",
    icon: <ListIcon />,
  },
  {
    num: "02",
    title: "Buyer pays into escrow",
    desc: "Funds are held securely until you confirm you're happy with the item.",
    icon: <EscrowIcon />,
  },
  {
    num: "03",
    title: "Item delivered",
    desc: "Seller ships or meets locally. Buyer confirms receipt.",
    icon: <ShipIcon />,
  },
  {
    num: "04",
    title: "Funds released",
    desc: "Escrow releases payment to the seller. Everyone's protected.",
    icon: <ReleaseIcon />,
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <div className="hiw-strip">
      {steps.map((step, i) => (
        <React.Fragment key={step.num}>
          <div className="hiw-step">
            <div className="hiw-icon">{step.icon}</div>
            <div className="hiw-num">{step.num}</div>
            <div className="hiw-title">{step.title}</div>
            <div className="hiw-desc">{step.desc}</div>
          </div>
          {i < steps.length - 1 && (
            <div className="hiw-arrow">›</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};