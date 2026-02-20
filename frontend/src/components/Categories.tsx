// src/components/Categories.tsx
import React, { useState } from "react";
import "../styles/Categories.css";

type CategoryChipsProps = {
  categories?: string[];
  onSelect?: (category: string) => void;
};

const defaultCategories = ["All", "Electronics", "Services", "Furniture", "Books", "Fashion", "Gaming"];

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories = defaultCategories,
  onSelect,
}) => {
  const [active, setActive] = useState("All");

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