#!/usr/bin/env node
/**
 * Simple script to create basic placeholder PWA icons
 * 
 * This script generates a set of placeholder icons with different sizes
 * for use as PWA icons. You'll want to replace these with actual icons
 * for production use.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Basic HTML canvas code to create a simple icon
function createIconSvgContent(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#4f46e5" />
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white" />
  <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="${size/4}" fill="#4f46e5">LIT</text>
</svg>`;
}

// Create icon files for various sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  // Create an SVG placeholder icon (simple and doesn't require additional dependencies)
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, createIconSvgContent(size));
  
  console.log(`Created SVG icon: ${svgPath}`);
}

// Create simple splash screen SVGs
const splashSizes = [
  { name: 'splash-640x1136.svg', width: 640, height: 1136 },
  { name: 'splash-750x1334.svg', width: 750, height: 1334 },
  { name: 'splash-1125x2436.svg', width: 1125, height: 2436 },
  { name: 'splash-1242x2208.svg', width: 1242, height: 2208 },
  { name: 'splash-1536x2048.svg', width: 1536, height: 2048 },
  { name: 'splash-1668x2388.svg', width: 1668, height: 2388 },
  { name: 'splash-2048x2732.svg', width: 2048, height: 2732 }
];

function createSplashSvgContent(width, height) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff" />
  <rect x="${width/2 - width/4}" y="${height/2 - height/8}" width="${width/2}" height="${height/4}" fill="#4f46e5" rx="20" ry="20" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="${width/15}" fill="white">Lease It Thailand</text>
</svg>`;
}

for (const size of splashSizes) {
  const splashPath = path.join(iconsDir, size.name);
  fs.writeFileSync(splashPath, createSplashSvgContent(size.width, size.height));
  console.log(`Created splash screen: ${splashPath}`);
}

console.log('\nPlaceholder icons and splash screens created successfully!');
console.log('NOTE: These are SVG placeholders. For production, replace them with actual icons and splash screens.');
console.log('You can convert them to PNG format using tools like ImageMagick or an online converter.');
