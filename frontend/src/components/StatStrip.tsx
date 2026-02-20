// src/components/StatsStrip.tsx
import React from "react";
import "../styles/StatsStrip.css";

type Stat = {
  value: string;
  label: string;
};

type StatsStripProps = {
  stats?: Stat[];
};

const defaultStats: Stat[] = [
  { value: "2.4M+",    label: "Active Listings" },
  { value: "98.7%",    label: "Buyer Satisfaction" },
  { value: "$0 Fraud", label: "Escrow-Backed Guarantee" },
  { value: "140+",     label: "Countries Served" },
];

export const StatsStrip: React.FC<StatsStripProps> = ({ stats = defaultStats }) => {
  return (
    <div className="stats-strip">
      {stats.map(({ value, label }) => (
        <div key={label} className="stat-item">
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
};