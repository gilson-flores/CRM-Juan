import React from 'react';

// SVG oficial otimizado e incorporado diretamente para renderização 100% à prova de falhas de rede ou caminhos
export function OfficialLogoSvg({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 500 500" 
      className={className}
      style={style}
      role="img"
      aria-label="JC Eletricista"
    >
      <defs>
        <linearGradient id="svgBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#141418"/>
          <stop offset="50%" stopColor="#0e0e11"/>
          <stop offset="100%" stopColor="#08080a"/>
        </linearGradient>
        <pattern id="svgCarbonPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="#1c1c22" strokeWidth="3" />
          <line x1="5" y1="0" x2="5" y2="10" stroke="#0e0e12" strokeWidth="3" />
        </pattern>
        <linearGradient id="svgOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA845"/>
          <stop offset="50%" stopColor="#FF7A00"/>
          <stop offset="100%" stopColor="#E65500"/>
        </linearGradient>
        <filter id="svgOrangeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Card Background */}
      <rect width="500" height="500" rx="36" fill="url(#svgBgGrad)" stroke="#26262e" strokeWidth="4"/>
      <rect width="500" height="500" rx="36" fill="url(#svgCarbonPattern)" opacity="0.6"/>

      {/* Glow behind JC */}
      <circle cx="250" cy="180" r="140" fill="#FF7A00" opacity="0.12" filter="url(#svgOrangeGlow)"/>

      {/* JC Monogram with orange outline & glow */}
      <g transform="skewX(-8)">
        {/* Outer Glow / Stroke */}
        <text x="270" y="210" textAnchor="middle" fontFamily="'Impact', 'Arial Black', sans-serif" fontSize="190" fontWeight="900" fill="none" stroke="#FF7A00" strokeWidth="18" strokeLinejoin="round" opacity="0.5" filter="url(#svgOrangeGlow)">JC</text>
        <text x="270" y="210" textAnchor="middle" fontFamily="'Impact', 'Arial Black', sans-serif" fontSize="190" fontWeight="900" fill="none" stroke="#FFA845" strokeWidth="6" strokeLinejoin="round">JC</text>
        {/* Inner Fill */}
        <text x="270" y="210" textAnchor="middle" fontFamily="'Impact', 'Arial Black', sans-serif" fontSize="190" fontWeight="900" fill="url(#svgOrangeGrad)">JC</text>
      </g>

      {/* ELETRICISTA (White Bold Uppercase) */}
      <text x="250" y="325" textAnchor="middle" fontFamily="'Montserrat', 'Arial Black', 'Helvetica', sans-serif" fontSize="44" fontWeight="900" letterSpacing="8" fill="#FFFFFF">ELETRICISTA</text>

      {/* residencial / comercial (Orange) */}
      <text x="250" y="375" textAnchor="middle" fontFamily="'Arial', 'Helvetica', sans-serif" fontSize="24" fontWeight="700" letterSpacing="2" fill="#FF7A00">residencial / comercial</text>

      {/* Orange Line Left */}
      <line x1="60" y1="430" x2="220" y2="430" stroke="#FF7A00" strokeWidth="3" strokeLinecap="round"/>

      {/* Center Lightning Bolt (Glowing Orange) */}
      <g filter="url(#svgOrangeGlow)">
        <path d="M 252 408 L 238 432 L 247 432 L 242 452 L 262 426 L 253 426 Z" fill="#FF7A00"/>
      </g>

      {/* Orange Line Right */}
      <line x1="280" y1="430" x2="440" y2="430" stroke="#FF7A00" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// Data URI universal do SVG para uso em tags <img> ou no Firestore
export const OFFICIAL_LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141418"/>
      <stop offset="50%" stop-color="#0e0e11"/>
      <stop offset="100%" stop-color="#08080a"/>
    </linearGradient>
    <pattern id="carbonPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#1c1c22" stroke-width="3" />
      <line x1="5" y1="0" x2="5" y2="10" stroke="#0e0e12" stroke-width="3" />
    </pattern>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFA845"/>
      <stop offset="50%" stop-color="#FF7A00"/>
      <stop offset="100%" stop-color="#E65500"/>
    </linearGradient>
    <filter id="orangeGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <rect width="500" height="500" rx="36" fill="url(#bgGrad)" stroke="#26262e" stroke-width="4"/>
  <rect width="500" height="500" rx="36" fill="url(#carbonPattern)" opacity="0.6"/>

  <circle cx="250" cy="180" r="140" fill="#FF7A00" opacity="0.12" filter="url(#orangeGlow)"/>

  <g transform="skewX(-8)">
    <text x="270" y="210" text-anchor="middle" font-family="'Impact', 'Arial Black', sans-serif" font-size="190" font-weight="900" fill="none" stroke="#FF7A00" stroke-width="18" stroke-linejoin="round" opacity="0.5" filter="url(#orangeGlow)">JC</text>
    <text x="270" y="210" text-anchor="middle" font-family="'Impact', 'Arial Black', sans-serif" font-size="190" font-weight="900" fill="none" stroke="#FFA845" stroke-width="6" stroke-linejoin="round">JC</text>
    <text x="270" y="210" text-anchor="middle" font-family="'Impact', 'Arial Black', sans-serif" font-size="190" font-weight="900" fill="url(#orangeGrad)">JC</text>
  </g>

  <text x="250" y="325" text-anchor="middle" font-family="'Montserrat', 'Arial Black', 'Helvetica', sans-serif" font-size="44" font-weight="900" letter-spacing="8" fill="#FFFFFF">ELETRICISTA</text>

  <text x="250" y="375" text-anchor="middle" font-family="'Arial', 'Helvetica', sans-serif" font-size="24" font-weight="700" letter-spacing="2" fill="#FF7A00">residencial / comercial</text>

  <line x1="60" y1="430" x2="220" y2="430" stroke="#FF7A00" stroke-width="3" stroke-linecap="round"/>

  <g filter="url(#orangeGlow)">
    <path d="M 252 408 L 238 432 L 247 432 L 242 452 L 262 426 L 253 426 Z" fill="#FF7A00"/>
  </g>

  <line x1="280" y1="430" x2="440" y2="430" stroke="#FF7A00" stroke-width="3" stroke-linecap="round"/>
</svg>
`)}`;
