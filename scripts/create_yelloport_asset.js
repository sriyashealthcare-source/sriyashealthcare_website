const fs = require('fs');
const path = require('path');

// Generate an SVG graphic for YelloPort Elite Trocar System
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fbf9f4"/>
      <stop offset="50%" stopColor="#f5f0e6"/>
      <stop offset="100%" stopColor="#ede5d3"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#dfba66"/>
      <stop offset="50%" stopColor="#c5a059"/>
      <stop offset="100%" stopColor="#9a762e"/>
    </linearGradient>
    <linearGradient id="steelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#f0f3f6"/>
      <stop offset="35%" stopColor="#d2d8e0"/>
      <stop offset="65%" stopColor="#9aa6b6"/>
      <stop offset="100%" stopColor="#5c6978"/>
    </linearGradient>
    <linearGradient id="yellowPortGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#f7d046"/>
      <stop offset="40%" stopColor="#ffd943"/>
      <stop offset="70%" stopColor="#e5be28"/>
      <stop offset="100%" stopColor="#b38e0a"/>
    </linearGradient>
    <radialGradient id="sealGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#ffd943" stopOpacity="0.4"/>
      <stop offset="100%" stopColor="#ffd943" stopOpacity="0"/>
    </radialGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#1a2530" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="600" fill="url(#bgGrad)"/>
  
  <!-- Subtle decorative technical grid circles -->
  <circle cx="400" cy="300" r="260" fill="none" stroke="#c5a059" stroke-width="1" stroke-opacity="0.15" stroke-dasharray="4 6"/>
  <circle cx="400" cy="300" r="190" fill="none" stroke="#c5a059" stroke-width="1" stroke-opacity="0.2"/>

  <!-- Main Illustration Group with shadow -->
  <g filter="url(#dropShadow)" transform="translate(100, 70)">
    
    <!-- 1. Trocar Obturator (Left/Center Angle) -->
    <g transform="rotate(-32 280 240)">
      <!-- Obturator Rod (Stainless Steel) -->
      <rect x="270" y="80" width="18" height="340" rx="9" fill="url(#steelGrad)"/>
      <!-- Sharp Dilating Tip / Pencil Point -->
      <path d="M 270 420 L 279 460 L 288 420 Z" fill="url(#goldGrad)"/>
      <path d="M 275 420 L 279 460 L 283 420 Z" fill="#ffffff" opacity="0.6"/>
      <!-- Ergonomic Handle (Microline Blue/Charcoal) -->
      <path d="M 245 40 C 245 25, 313 25, 313 40 L 305 85 L 253 85 Z" fill="#1b2a3a"/>
      <!-- Handle Grips & Gold Accent Strip -->
      <rect x="250" y="55" width="58" height="6" rx="3" fill="url(#goldGrad)"/>
      <rect x="258" y="70" width="42" height="4" rx="2" fill="#304356"/>
      <rect x="258" y="44" width="42" height="3" rx="1.5" fill="#304356"/>
    </g>

    <!-- 2. Cannula & YelloPort Valve Assembly (Right Angle) -->
    <g transform="rotate(24 350 260)">
      <!-- Micro-Ribbed Cannula Tube (Stainless Steel) -->
      <rect x="340" y="160" width="26" height="280" rx="4" fill="url(#steelGrad)"/>
      <!-- Micro-Ribs for wall retention -->
      <line x1="337" y1="200" x2="369" y2="200" stroke="#718294" stroke-width="3" stroke-linecap="round"/>
      <line x1="337" y1="230" x2="369" y2="230" stroke="#718294" stroke-width="3" stroke-linecap="round"/>
      <line x1="337" y1="260" x2="369" y2="260" stroke="#718294" stroke-width="3" stroke-linecap="round"/>
      <line x1="337" y1="290" x2="369" y2="290" stroke="#718294" stroke-width="3" stroke-linecap="round"/>
      <line x1="337" y1="320" x2="369" y2="320" stroke="#718294" stroke-width="3" stroke-linecap="round"/>
      <line x1="337" y1="350" x2="369" y2="350" stroke="#718294" stroke-width="3" stroke-linecap="round"/>
      <line x1="337" y1="380" x2="369" y2="380" stroke="#718294" stroke-width="3" stroke-linecap="round"/>
      
      <!-- Distal Bevel -->
      <path d="M 340 440 L 366 440 L 366 425 Z" fill="#9aa6b6"/>

      <!-- Stopcock / Gas Inflow Valve -->
      <rect x="366" y="138" width="36" height="12" rx="3" fill="url(#steelGrad)"/>
      <path d="M 402 134 L 416 134 L 416 154 L 402 154 Z" fill="#2c3e50"/>
      <circle cx="409" cy="144" r="5" fill="url(#goldGrad)"/>

      <!-- Cannula Housing Body (Sleek Dark Blue/Grey Ergonomic) -->
      <path d="M 322 100 C 322 88, 384 88, 384 100 L 372 160 L 334 160 Z" fill="#243447"/>
      <!-- Housing Chrome Ring -->
      <rect x="328" y="125" width="50" height="4" rx="2" fill="url(#steelGrad)"/>

      <!-- Universal Seal (Signature Yellow / Golden Ring Housing) -->
      <circle cx="353" cy="85" r="32" fill="url(#sealGlow)"/>
      <ellipse cx="353" cy="86" rx="26" ry="12" fill="url(#yellowPortGrad)"/>
      <ellipse cx="353" cy="84" rx="22" ry="9" fill="#1b2a3a"/>
      <!-- Universal Seal Elastomeric Aperture (5-12mm flex seal) -->
      <ellipse cx="353" cy="84" rx="14" ry="5" fill="#f7d046" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="353" cy="84" r="4" fill="#111822"/>
    </g>

    <!-- 3. Detached Single-Use Universal Seal (Floating at top left) -->
    <g transform="translate(40, 110)">
      <circle cx="60" cy="60" r="46" fill="url(#sealGlow)"/>
      <ellipse cx="60" cy="60" rx="36" ry="18" fill="url(#yellowPortGrad)"/>
      <ellipse cx="60" cy="57" rx="30" ry="14" fill="#243447"/>
      <ellipse cx="60" cy="57" rx="18" ry="7" fill="#ffd943" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="60" cy="57" r="5" fill="#111822"/>
      <text x="60" y="98" font-family="'Cinzel', 'Playfair Display', serif" font-size="11" font-weight="700" fill="#9a762e" text-anchor="middle" letter-spacing="1">5–12mm UNIVERSAL SEAL</text>
    </g>

  </g>

  <!-- Title & Specification Badge Overlay -->
  <g transform="translate(60, 500)">
    <rect x="0" y="0" width="680" height="64" rx="12" fill="#ffffff" fill-opacity="0.9" stroke="#c5a059" stroke-width="1.2" filter="url(#dropShadow)"/>
    <text x="24" y="28" font-family="'Cinzel', 'Playfair Display', serif" font-size="16" font-weight="700" fill="#1b2a3a" letter-spacing="1">YelloPort® Elite</text>
    <text x="175" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#c5a059">| Reposable Laparoscopic Port Access System</text>
    <text x="24" y="48" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" fill="#5c6978">Universal Seal (5–12mm) · Micro-Ribbed Reusable Cannula · Microline Surgical / AMS</text>
    <!-- Code pill -->
    <rect x="580" y="18" width="76" height="26" rx="6" fill="#f5f0e6" stroke="#c5a059" stroke-width="0.8"/>
    <text x="618" y="35" font-family="system-ui, monospace" font-size="11" font-weight="700" fill="#9a762e" text-anchor="middle">EA512US</text>
  </g>
</svg>`;

const outputPath = path.join(__dirname, '../client/public/assets/products/yelloport_elite-1.png');
// Save as SVG as well for crisp rendering
const svgPath = path.join(__dirname, '../client/public/assets/products/yelloport_elite-1.svg');
fs.writeFileSync(svgPath, svg, 'utf8');
console.log('Saved SVG:', svgPath);

// Write SVG content to PNG path or file
fs.writeFileSync(outputPath, svg, 'utf8');
console.log('Saved image at:', outputPath);
