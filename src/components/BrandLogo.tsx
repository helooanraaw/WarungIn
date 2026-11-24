import React from "react";

interface BrandLogoProps {
  size?: number;
  variant?: "color" | "tile" | "white";
  className?: string;
}

/**
 * Ikon resmi Warungin ("Atap & Keranjang").
 * - "color": Atap biru (#1A76D1) & keranjang slate (#1B2733) untuk latar terang.
 * - "tile": Ikon putih di dalam kotak biru (#1976D2) untuk sidebar gelap / header aplikasi.
 * - "white": Siluet putih solid untuk latar berwarna.
 */
export default function BrandLogo({
  size = 32,
  variant = "color",
  className = "",
}: BrandLogoProps) {
  if (variant === "tile") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Logo Warungin"
        className={`shrink-0 ${className}`}
      >
        <rect width="256" height="256" rx="44" fill="#1976D2" />
        <g transform="translate(128, 122.88) scale(0.68) translate(-128, -128)">
          <path
            fill="#FFFFFF"
            d="M128 24 L226 122 H186 L128 64 L70 122 H30 Z"
          />
          <path
            fill="#FFFFFF"
            fillRule="evenodd"
            d="M42 146 H214 L191 232 H65 Z M84 172 H172 V204 H84 Z"
          />
        </g>
      </svg>
    );
  }

  if (variant === "white") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Logo Warungin"
        className={`shrink-0 ${className}`}
      >
        <path
          fill="#FFFFFF"
          d="M128 24 L228 124 H188 L128 64 L68 124 H28 Z"
        />
        <path
          fill="#FFFFFF"
          fillRule="evenodd"
          d="M44 142 H212 L189 228 H67 Z M90 170 H166 V198 H90 Z"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo Warungin"
      className={`shrink-0 ${className}`}
    >
      <path
        fill="#1A76D1"
        d="M128 24 L228 124 H188 L128 64 L68 124 H28 Z"
      />
      <path
        fill="#1B2733"
        fillRule="evenodd"
        d="M44 142 H212 L189 228 H67 Z M90 170 H166 V198 H90 Z"
      />
    </svg>
  );
}
