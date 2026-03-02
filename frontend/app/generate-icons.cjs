// Generate PWA icons using sharp (installs fast, no native deps issues)
// Run: node generate-icons.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Install sharp if needed
try { require.resolve('sharp'); } catch(e) {
  console.log('Installing sharp...');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
}

const sharp = require('sharp');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT_DIR = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Generate SVG icon (LifeOrganizer logo: orange gradient with "LO" monogram)
function makeSvg(size) {
  const r = Math.round(size * 0.5);
  const fontSize = Math.round(size * 0.42);
  const y = Math.round(size * 0.56);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fb923c"/>
      <stop offset="100%" style="stop-color:#c2410c"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <text x="${size/2}" y="${y}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="bold"
    fill="white" text-anchor="middle" opacity="0.95">L</text>
  <circle cx="${Math.round(size*0.65)}" cy="${Math.round(size*0.32)}" r="${Math.round(size*0.07)}"
    fill="white" opacity="0.85"/>
</svg>`;
}

// Generate splash screen SVG
function makeSplashSvg(w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#fff7ed"/>
      <stop offset="100%" style="stop-color:#fed7aa"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="${w/2-60}" y="${h/2-80}" width="120" height="120" rx="30" fill="#f97316"/>
  <text x="${w/2}" y="${h/2+10}" font-family="Georgia, serif" font-size="72" font-weight="bold"
    fill="white" text-anchor="middle">L</text>
  <text x="${w/2}" y="${h/2+90}" font-family="Arial, sans-serif" font-size="32"
    fill="#9a3412" text-anchor="middle">LifeOrganizer AI</text>
</svg>`;
}

async function run() {
  console.log('Generating PWA icons...');
  for (const size of SIZES) {
    const svg = Buffer.from(makeSvg(size));
    await sharp(svg).png().toFile(path.join(OUT_DIR, `icon-${size}x${size}.png`));
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // Splash screens
  const splashes = [
    [1290, 2796], [1179, 2556], [1170, 2532],
    [1125, 2436], [828, 1792], [750, 1334]
  ];
  console.log('\nGenerating splash screens...');
  for (const [w, h] of splashes) {
    const svg = Buffer.from(makeSplashSvg(w, h));
    await sharp(svg).png().toFile(path.join(OUT_DIR, `splash-${w}x${h}.png`));
    console.log(`  ✓ splash-${w}x${h}.png`);
  }

  // Also copy 192 as favicon
  fs.copyFileSync(path.join(OUT_DIR, 'icon-192x192.png'), path.join(OUT_DIR, 'apple-touch-icon.png'));
  console.log('\n✅ All icons generated in public/icons/');
}

run().catch(console.error);
