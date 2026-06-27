#!/usr/bin/env node
// generate-og-gh.mjs — GitHub Actions OG image generator (SVG + resvg)
// Runs in the repo root. Requires @resvg/resvg-js installed.
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const repoName = process.env.REPO_NAME || path.basename(process.cwd());

// Load config
const configPath = ".github/social-preview.config.json";
let cfg = {
  title: repoName,
  subtitle: "",
  accent: "#6C5CE7",
  darkMode: true,
  emoji: "⚡",
  author: "Rafael Zendron",
  tags: [],
};

if (fs.existsSync(configPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
    Object.assign(cfg, raw);
  } catch (e) {
    console.warn("Warning: Failed to parse config:", e.message);
  }
}

// Colors
const bg = cfg.darkMode ? "#0D1117" : "#FFFFFF";
const fg = cfg.darkMode ? "#E6EDF3" : "#1F2328";
const mt = cfg.darkMode ? "#8B949E" : "#656D76";
const bd = cfg.darkMode ? "#30363D" : "#D0D7DE";
const cb = cfg.darkMode ? "#161B22" : "#F6F8FA";
const ac = cfg.accent || "#6C5CE7";

// Accent RGB
const hx = ac.replace("#", "");
const ar = parseInt(hx.substring(0, 2), 16) + "," + parseInt(hx.substring(2, 4), 16) + "," + parseInt(hx.substring(4, 6), 16);

// SVG helpers
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const wrap = (t, m) => {
  const words = t.split(" ");
  const lines = [];
  let ln = "";
  for (const w of words) {
    if (ln.length + w.length + 1 > m && ln) {
      lines.push(ln.trim());
      ln = w;
    } else {
      ln += (ln ? " " : "") + w;
    }
  }
  if (ln.trim()) lines.push(ln.trim());
  return lines;
};

// Title sizing
const titleLen = cfg.title.length;
const tFS = titleLen <= 12 ? 64 : titleLen <= 20 ? 52 : titleLen <= 30 ? 42 : 34;
const tM = Math.floor(900 / (tFS * 0.6));
const titleLines = wrap(esc(cfg.title), tM);
const titleY = Math.max(300 - (titleLines.length - 1) * (tFS + 8), 260);

// Subtitle
const subLines = cfg.subtitle ? wrap(esc(cfg.subtitle), 45) : [];
const subY = titleY + titleLines.length * (tFS + 8) + 20;

// Tags
const tagsY = subY + subLines.length * 40 + 30;
const tagSpace = 160;
const totalTagsW = cfg.tags.length * tagSpace;
const tagStartX = Math.max((1200 - totalTagsW) / 2, 100);
const tagSvg = cfg.tags
  .map((t, i) => {
    const x = tagStartX + i * tagSpace;
    const pw = Math.min(t.length * 10 + 30, 140);
    return (
      `<rect x="${x}" y="${tagsY}" width="${pw}" height="32" rx="16" fill="rgba(${ar},0.1)" stroke="rgba(${ar},0.3)" stroke-width="1"/>` +
      `<text x="${x + pw / 2}" y="${tagsY + 22}" text-anchor="middle" font-family="DejaVu Sans,system-ui,sans-serif" font-size="16" fill="${ac}">${esc(t)}</text>`
    );
  })
  .join("");

// Separator & Author
const sepY = tagsY + 52;
const authorY = sepY + 40;

// Build SVG
const svg =
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">` +
  `<defs>` +
    `<linearGradient id="tB" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${ac}" stop-opacity="1"/><stop offset="100%" stop-color="${ac}" stop-opacity="0.3"/></linearGradient>` +
    `<linearGradient id="bB" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${ac}" stop-opacity="0.3"/><stop offset="100%" stop-color="${ac}" stop-opacity="1"/></linearGradient>` +
  `</defs>` +
  `<rect width="1200" height="630" fill="${bg}"/>` +
  `<rect width="1200" height="6" fill="url(#tB)"/>` +
  `<rect y="624" width="1200" height="6" fill="url(#bB)"/>` +
  `<rect x="150" y="80" width="900" height="470" rx="20" fill="${cb}" stroke="${bd}" stroke-width="1"/>` +
  `<text x="600" y="180" text-anchor="middle" font-size="64">${cfg.emoji}</text>` +
  titleLines.map((l, i) => `<text x="600" y="${titleY + i * (tFS + 8)}" text-anchor="middle" font-family="DejaVu Sans,system-ui,sans-serif" font-size="${tFS}" font-weight="bold" fill="${fg}">${l}</text>`).join("") +
  subLines.map((l, i) => `<text x="600" y="${subY + i * 40}" text-anchor="middle" font-family="DejaVu Sans,system-ui,sans-serif" font-size="26" fill="${mt}">${l}</text>`).join("") +
  tagSvg +
  `<rect x="560" y="${sepY}" width="80" height="3" rx="2" fill="${ac}" opacity="0.6"/>` +
  `<circle cx="565" cy="${authorY + 4}" r="10" fill="${ac}" opacity="0.8"/>` +
  `<text x="585" y="${authorY + 10}" font-family="DejaVu Sans,system-ui,sans-serif" font-size="20" fill="${mt}">by ${esc(cfg.author)}</text>` +
  `</svg>`;

// Render
const resvg = new Resvg(svg, { background: bg, fitTo: { mode: "width", value: 1200 } });
const pngData = resvg.render().asPng();

// Write
fs.writeFileSync("social-preview.png", pngData);
fs.writeFileSync("og-image.png", pngData);
console.log(`Generated social-preview.png (${Math.round(pngData.length / 1024)} KB) and og-image.png`);
