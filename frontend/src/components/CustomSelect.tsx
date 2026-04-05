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
}

export const CustomSelect: React.FC<Props> = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
          {options.map(opt => (
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