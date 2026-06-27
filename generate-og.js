#!/usr/bin/env node
/**
 * OG Image Generator - SquadOps Style
 * Generates social preview images using SVG + resvg-js (no satori needed).
 * 
 * Usage: node generate-og.js [config.json]
 * Default config: .github/social-preview.config.json
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load config
const configPath = process.argv[2] || join(process.cwd(), '.github/social-preview.config.json');
const defaults = {
  title: 'Project',
  subtitle: '',
  accent: '#6C5CE7',
  darkMode: true,
  emoji: '⚡',
  author: 'Rafael Zendron',
  tags: [],
};

let config = { ...defaults };
if (existsSync(configPath)) {
  const raw = readFileSync(configPath, 'utf8');
  config = { ...defaults, ...JSON.parse(raw) };
}

// Colors
const bg = config.darkMode ? '#0D1117' : '#FFFFFF';
const fg = config.darkMode ? '#E6EDF3' : '#1F2328';
const muted = config.darkMode ? '#8B949E' : '#656D76';
const border = config.darkMode ? '#30363D' : '#D0D7DE';
const cardBg = config.darkMode ? '#161B22' : '#F6F8FA';
const accent = config.accent || '#6C5CE7';

// Parse accent for opacity variants
const hex = accent.replace('#', '');
const r = parseInt(hex.substring(0, 2), 16);
const g = parseInt(hex.substring(2, 4), 16);
const b = parseInt(hex.substring(4, 6), 16);
const accentRGB = `${r},${g},${b}`;

// Escape XML entities in text
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Calculate text wrapping (approximate, 8px per char at 28px font)
function wrapText(text, maxCharsPerLine) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxCharsPerLine && currentLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

// Title sizing: bigger title = smaller font
function titleFontSize(text) {
  if (text.length <= 12) return 64;
  if (text.length <= 20) return 52;
  if (text.length <= 30) return 42;
  return 34;
}

function titleMaxCharsPerLine(fontSize) {
  return Math.floor(900 / (fontSize * 0.6));
}

// Build SVG
const tFontSize = titleFontSize(config.title);
const tMaxChars = titleMaxCharsPerLine(tFontSize);
const titleLines = wrapText(esc(config.title), tMaxChars);
const titleYStart = Math.max(300 - (titleLines.length - 1) * (tFontSize + 8), 260);

const subtitleLines = config.subtitle ? wrapText(esc(config.subtitle), 45) : [];
const subtitleYStart = titleYStart + titleLines.length * (tFontSize + 8) + 20;

const tagsY = subtitleYStart + subtitleLines.length * 40 + 30;

// Build tag pills
const tagSpacing = 160;
const tagsTotalWidth = config.tags.length * tagSpacing;
const tagsXStart = Math.max((1200 - tagsTotalWidth) / 2, 100);

const tagsSVG = config.tags.map((tag, i) => {
  const x = tagsXStart + i * tagSpacing;
  const pillWidth = Math.min(tag.length * 10 + 30, 140);
  return `
    <rect x="${x}" y="${tagsY}" width="${pillWidth}" height="32" rx="16" fill="rgba(${accentRGB},0.1)" stroke="rgba(${accentRGB},0.3)" stroke-width="1"/>
    <text x="${x + pillWidth / 2}" y="${tagsY + 22}" text-anchor="middle" font-family="DejaVu Sans, system-ui, sans-serif" font-size="16" fill="${accent}">${esc(tag)}</text>
  `;
}).join('\n');

// Separator + author
const separatorY = tagsY + 52;
const authorY = separatorY + 40;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.3"/>
    </linearGradient>
    <linearGradient id="bottomBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="1"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="${bg}"/>
  
  <!-- Accent bars -->
  <rect width="1200" height="6" fill="url(#topBar)"/>
  <rect y="624" width="1200" height="6" fill="url(#bottomBar)"/>
  
  <!-- Card -->
  <rect x="150" y="80" width="900" height="470" rx="20" fill="${cardBg}" stroke="${border}" stroke-width="1"/>
  
  <!-- Emoji -->
  <text x="600" y="180" text-anchor="middle" font-size="64">${config.emoji}</text>
  
  <!-- Title -->
  ${titleLines.map((line, i) => `
  <text x="600" y="${titleYStart + i * (tFontSize + 8)}" text-anchor="middle" font-family="DejaVu Sans, system-ui, sans-serif" font-size="${tFontSize}" font-weight="bold" fill="${fg}">${line}</text>`).join('')}
  
  <!-- Subtitle -->
  ${subtitleLines.map((line, i) => `
  <text x="600" y="${subtitleYStart + i * 40}" text-anchor="middle" font-family="DejaVu Sans, system-ui, sans-serif" font-size="26" fill="${muted}">${line}</text>`).join('')}
  
  <!-- Tags -->
  ${tagsSVG}
  
  <!-- Separator -->
  <rect x="560" y="${separatorY}" width="80" height="3" rx="2" fill="${accent}" opacity="0.6"/>
  
  <!-- Author -->
  <circle cx="565" cy="${authorY + 4}" r="10" fill="${accent}" opacity="0.8"/>
  <text x="585" y="${authorY + 10}" font-family="DejaVu Sans, system-ui, sans-serif" font-size="20" fill="${muted}">by ${esc(config.author)}</text>
</svg>`;

// Convert to PNG
const resvg = new Resvg(svg, {
  background: bg,
  fitTo: { mode: 'width', value: 1200 },
});
const pngBuffer = resvg.render().asPng();
const outputPath = process.argv[3] || join(process.cwd(), 'social-preview.png');
writeFileSync(outputPath, pngBuffer);
console.log(`Generated ${outputPath} (${(pngBuffer.length / 1024).toFixed(1)} KB, ${config.title})`);

// Also write og-image.png
const ogPath = join(process.cwd(), 'og-image.png');
writeFileSync(ogPath, pngBuffer);
console.log(`Generated ${ogPath}`);
