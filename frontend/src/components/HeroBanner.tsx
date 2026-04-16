// src/components/HeroBanner.tsx
import React from "react";
import "../styles/HeroBanner.css";

type FloatItem = { src: string; alt: string };

type HeroBannerProps = {
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  floats?: FloatItem[];
};

const defaultFloats: FloatItem[] = [
  { src: "https://images.unsplash.com/photo-1592832122594-c0c6bad718b1?w=400", alt: "iPhone" },
  { src: "https://images.unsplash.com/photo-1637780852590-8ab27248ec41?w=400", alt: "Headphones" },
  { src: "https://images.unsplash.com/photo-1731132198530-e4b2dc51d511?w=400", alt: "Sneakers" },
  { src: "https://images.unsplash.com/photo-1703002574442-1996d6f59bc5?w=400", alt: "Laptop" },
];

const FALLBACK_EMOJIS = ["📷", "📱", "🎧", "👟"];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title = "Discover & Buy",
  titleAccent = "Trusted Products",
  subtitle = "The safest marketplace for buying and selling anything — protected by escrow at every step.",
  floats = defaultFloats,
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
        </div>

        <div className="hero-visuals">
          <div className="hero-glow" />
          {floats.slice(0, 4).map((item, i) => (
            <div key={i} className={`hero-float ${floatClasses[i]}`}>
              {item.src
                ? <img src={item.src} alt={item.alt} className="hero-float-img" />
                : <span>{FALLBACK_EMOJIS[i]}</span>
              }
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};