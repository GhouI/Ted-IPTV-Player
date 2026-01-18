/**
 * Script to generate app icons for Ted IPTV Player
 * Creates 220x220 and 400x400 PNG icons for VIDAA TV
 */

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// SVG template for the app icon
// A simple TV icon with "TED" text
const createIconSvg = (size) => {
  const padding = Math.round(size * 0.1);
  const tvWidth = size - padding * 2;
  const tvHeight = Math.round(tvWidth * 0.65);
  const tvX = padding;
  const tvY = Math.round((size - tvHeight - size * 0.08) / 2);
  const screenPadding = Math.round(tvWidth * 0.06);
  const cornerRadius = Math.round(tvWidth * 0.05);
  const standWidth = Math.round(tvWidth * 0.4);
  const standHeight = Math.round(size * 0.06);
  const standX = (size - standWidth) / 2;
  const standY = tvY + tvHeight;
  const fontSize = Math.round(tvWidth * 0.28);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <linearGradient id="tvGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#2d2d44"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4a90d9"/>
      <stop offset="50%" style="stop-color:#357abd"/>
      <stop offset="100%" style="stop-color:#2868a8"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bgGradient)" rx="${cornerRadius * 2}"/>

  <!-- TV Body -->
  <rect x="${tvX}" y="${tvY}" width="${tvWidth}" height="${tvHeight}"
        fill="url(#tvGradient)" rx="${cornerRadius}" stroke="#3d3d5c" stroke-width="${Math.max(2, size * 0.01)}"/>

  <!-- TV Screen -->
  <rect x="${tvX + screenPadding}" y="${tvY + screenPadding}"
        width="${tvWidth - screenPadding * 2}" height="${tvHeight - screenPadding * 2}"
        fill="url(#screenGradient)" rx="${cornerRadius * 0.6}"/>

  <!-- Stand -->
  <rect x="${standX}" y="${standY}" width="${standWidth}" height="${standHeight}"
        fill="#2d2d44" rx="${standHeight / 2}"/>

  <!-- TED Text -->
  <text x="${size / 2}" y="${tvY + tvHeight / 2 + fontSize * 0.35}"
        font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold"
        fill="#ffffff" text-anchor="middle">TED</text>

  <!-- Subtitle -->
  <text x="${size / 2}" y="${tvY + tvHeight / 2 + fontSize * 0.35 + fontSize * 0.45}"
        font-family="Arial, sans-serif" font-size="${Math.round(fontSize * 0.28)}"
        fill="#8899aa" text-anchor="middle">IPTV</text>
</svg>
`.trim();
};

async function generateIcons() {
  // Ensure public directory exists
  await mkdir(publicDir, { recursive: true });

  const sizes = [220, 400];

  for (const size of sizes) {
    const svg = createIconSvg(size);
    const outputPath = join(publicDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`Generated: ${outputPath}`);
  }

  // Also create a favicon (32x32)
  const faviconSvg = createIconSvg(32);
  const faviconPath = join(publicDir, 'favicon.png');
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(faviconPath);
  console.log(`Generated: ${faviconPath}`);

  // Create a standard favicon.ico from the 32x32 PNG
  const favicon16Svg = createIconSvg(16);
  const favicon16Path = join(publicDir, 'favicon-16.png');
  await sharp(Buffer.from(favicon16Svg))
    .png()
    .toFile(favicon16Path);
  console.log(`Generated: ${favicon16Path}`);

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
