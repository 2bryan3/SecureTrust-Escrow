import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Categories.css";

interface CategoryChipsProps {
  categories?: string[];
  onSelect?: (cat: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({ categories: propCategories, onSelect }) => {
  const [active, setActive] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (propCategories) {
      setCategories(["All", ...propCategories]);
    } else {
      axios.get("/api/listings/categories", { withCredentials: true })
        .then(res => setCategories(["All", ...res.data]))
        .catch(console.error);
    }
  }, [propCategories]);

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