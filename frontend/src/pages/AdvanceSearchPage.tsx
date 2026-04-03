import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { categoryFields, allCategories } from "../data/categoryFields";
import type { CategoryField } from "../data/categoryFields";
import "../styles/AdvancedSearchPage.css";
import { CustomSelect } from "../components/CustomSelect";

export const AdvancedSearchPage: React.FC = () => {
  const navigate = useNavigate();

  const [keyword,    setKeyword]    = useState("");
  const [category,   setCategory]   = useState("");
  const [sortBy,     setSortBy]     = useState("newest");
  const [minPrice,   setMinPrice]   = useState("");
  const [maxPrice,   setMaxPrice]   = useState("");
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});

  const fields: CategoryField[] = category ? (categoryFields[category] ?? []) : [];

  const handleAttrChange = (key: string, value: string) => {
    setAttrValues(prev => ({ ...prev, [key]: value }));
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setAttrValues({});
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword)  params.set("q", keyword);
    if (category) params.set("category", category);
    if (sortBy && sortBy !== "newest") params.set("sortBy", sortBy);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    const filledAttrs = Object.fromEntries(
      Object.entries(attrValues).filter(([, v]) => v.trim() !== "")
    );
    if (Object.keys(filledAttrs).length > 0) {
      params.set("attributes", JSON.stringify(filledAttrs));
    }

    navigate(`/search?${params.toString()}`);
  };

  const categoryOptions = [
    { label: "All Categories", value: "" },
    ...allCategories.map(cat => ({ label: cat, value: cat })),
  ];

  const sortOptions = [
    { label: "Newest First",        value: "newest"   },
    { label: "Oldest First",        value: "oldest"   },
    { label: "Price: Low to High",  value: "minPrice" },
    { label: "Price: High to Low",  value: "maxPrice" },
  ];

  return (
    <>
      <NavBar />
      <div className="adv-search-page">
        <div className="adv-search-container">
          <div className="adv-search-header">
            <h1 className="adv-search-title">Advanced Search</h1>
            <p className="adv-search-sub">Filter listings by keyword, category, price, and more</p>
          </div>

          <div className="adv-search-form">

            {/* Keyword */}
            <div className="adv-field-group">
              <label className="adv-label">Keyword</label>
              <input
                className="adv-input"
                type="text"
                placeholder="Search for anything..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* Category */}
            <div className="adv-field-group">
              <label className="adv-label">Category</label>
              <CustomSelect
                value={category}
                onChange={handleCategoryChange}
                options={categoryOptions}
                placeholder="All Categories"
              />
            </div>

            {/* Price range */}
            <div className="adv-field-group">
              <label className="adv-label">Price Range</label>
              <div className="adv-price-row">
                <input
                  className="adv-input"
                  type="number"
                  placeholder="Min $"
                  min={0}
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                />
                <span className="adv-price-sep">—</span>
                <input
                  className="adv-input"
                  type="number"
                  placeholder="Max $"
                  min={0}
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Sort */}
            <div className="adv-field-group">
              <label className="adv-label">Sort By</label>
              <CustomSelect
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
              />
            </div>

            {/* Dynamic category fields */}
            {fields.length > 0 && (
              <div className="adv-category-fields">
                <p className="adv-category-fields-label">{category} Filters</p>
                {fields.map(field => (
                  <div className="adv-field-group" key={field.key}>
                    <label className="adv-label">{field.label}</label>
                    {field.type === "select" ? (
                      <CustomSelect
                        value={attrValues[field.key] ?? ""}
                        onChange={val => handleAttrChange(field.key, val)}
                        options={[
                          { label: "Any", value: "" },
                          ...(field.options?.map(opt => ({ label: opt, value: opt })) ?? []),
                        ]}
                        placeholder="Any"
                      />
                    ) : (
                      <input
                        className="adv-input"
                        type={field.type === "number" ? "number" : "text"}
                        placeholder={field.placeholder ?? ""}
                        value={attrValues[field.key] ?? ""}
                        onChange={e => handleAttrChange(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <button className="adv-search-btn" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>
    </>
  );
};