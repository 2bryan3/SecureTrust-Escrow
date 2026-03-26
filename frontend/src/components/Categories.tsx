// src/components/Categories.tsx
import React, { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import "../styles/Categories.css";

type CategoryChipsProps = {
  categories?: string[];
  onSelect?: (category: string) => void;
};

export const CategoryChips: React.FC<{ onSelect?: (cat: string) => void }> = ({ onSelect }) => {
  const [active, setActive] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    axios.get("/api/listings/categories", { withCredentials: true })
      .then(res => setCategories(["All", ...res.data]))
      .catch(console.error);
  }, []);

  const handleClick = (cat: string) => {
    setActive(cat);
    onSelect?.(cat);
  };

  return (
    <section className="category-chips">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`chip ${active === cat ? "chip--active" : ""}`}
          onClick={() => handleClick(cat)}
        >
          {cat}
        </button>
      ))}
    </section>
  );
};