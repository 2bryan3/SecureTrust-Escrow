// src/components/HeroBanner.tsx
import React from "react";
import "../styles/HeroBanner.css";

type HeroBannerProps = {
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  floats?: string[]; // emoji or text for each floating tile
};

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title = "Discover & Buy",
  titleAccent = "Trusted Products",
  subtitle = "The safest marketplace for buying and selling electronics, fashion, and collectibles — protected by smart escrow at every step.",
  ctaLabel = "Shop Now →",
  onCtaClick,
  floats = ["📷", "📱", "🎧", "👟"],
}) => {
  const floatClasses = ["hero-float--a", "hero-float--b", "hero-float--c", "hero-float--d"];

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Escrow-Protected Shopping
          </div>
          <h1>
            {title}<br />
            <span>{titleAccent}</span>
          </h1>
          <p>{subtitle}</p>
          <button className="primary-btn" onClick={onCtaClick}>
            {ctaLabel}
          </button>
        </div>

        <div className="hero-visuals">
          <div className="hero-glow" />
          {floats.slice(0, 4).map((icon, i) => (
            <div key={i} className={`hero-float ${floatClasses[i]}`}>
              {icon}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};