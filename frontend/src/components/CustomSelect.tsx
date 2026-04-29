import React, { useState, useEffect, useRef } from "react";
import "../styles/CustomSelect.css";

interface Option {
  label: string;
  value: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  searchable?: boolean;
}

export const CustomSelect: React.FC<Props> = ({ value, onChange, options, placeholder, searchable = false }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && searchable) {
      setSearchTerm("");
    }
  }, [open, searchable]);

  const selected = options.find(o => o.value === value);

  return (
    <div className="adv-custom-select-wrapper" ref={ref}>
      <button
        type="button"
        className="adv-custom-select-btn"
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected?.label ?? placeholder ?? "Select..."}</span>
        <span className={`adv-select-caret ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="adv-custom-select-dropdown">
          {searchable && (
            <div className="adv-custom-select-search">
              <input 
                type="text"
                className="adv-custom-select-item"
                placeholder="Type to filter..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          )}
          {(searchTerm
            ? options.filter(opt =>
                opt.label.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
                opt.value.toLowerCase().startsWith(searchTerm.toLowerCase())
              )
            : options
          ).map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`adv-custom-select-item ${value === opt.value ? "selected" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};