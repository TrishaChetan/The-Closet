// colorDetect.js — free, local dominant-colour extraction using canvas pixel data.
// No model, no network call: just downsample the image and bucket pixel colours.

/**
 * Given an HTMLImageElement (already loaded), returns { hex, name, hue, sat, light }
 * for the most common non-background colour in the image.
 */
export function detectDominantColor(imgEl) {
  const canvas = document.createElement('canvas');
  const size = 64; // downsample heavily — we only need the gist of the colour
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imgEl, 0, 0, size, size);

  let data;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch (e) {
    // Canvas may be tainted if the image came from a disallowed cross-origin source.
    return { hex: '#EFE8D8', name: 'Unknown', hue: 0, sat: 0, light: 0.9 };
  }

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    // Skip near-white / near-black extremes so we don't just pick up backgrounds/shadows
    const brightness = (r + g + b) / 3;
    if (brightness > 245 || brightness < 8) continue;

    // Quantize to reduce noise into meaningful buckets
    const key = `${Math.round(r / 16)}_${Math.round(g / 16)}_${Math.round(b / 16)}`;
    const entry = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
    entry.count++;
    entry.r += r; entry.g += g; entry.b += b;
    buckets.set(key, entry);
  }

  let best = null;
  for (const entry of buckets.values()) {
    if (!best || entry.count > best.count) best = entry;
  }

  if (!best) return { hex: '#EFE8D8', name: 'Neutral', hue: 0, sat: 0, light: 0.9 };

  const r = Math.round(best.r / best.count);
  const g = Math.round(best.g / best.count);
  const b = Math.round(best.b / best.count);
  const hex = rgbToHex(r, g, b);
  const { h, s, l } = rgbToHsl(r, g, b);

  return { hex, name: nameColor(h, s, l), hue: h, sat: s, light: l };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

/** Rough colour naming so users see "Navy" instead of a hex string. */
function nameColor(h, s, l) {
  if (l < 0.12) return 'Black';
  if (l > 0.9 && s < 0.15) return 'White';
  if (s < 0.12) {
    if (l < 0.35) return 'Charcoal';
    if (l < 0.65) return 'Grey';
    return 'Cream';
  }
  if (l < 0.25) {
    if (h < 30 || h >= 330) return 'Burgundy';
    if (h < 250 && h >= 190) return 'Navy';
    return 'Deep Tone';
  }
  if (h < 15 || h >= 345) return 'Red';
  if (h < 35) return 'Rust';
  if (h < 50) return 'Camel';
  if (h < 65) return 'Gold';
  if (h < 90) return 'Olive';
  if (h < 150) return 'Hunter Green';
  if (h < 190) return 'Teal';
  if (h < 220) return 'Sky Blue';
  if (h < 250) return 'Navy';
  if (h < 280) return 'Plum';
  if (h < 320) return 'Blush Pink';
  return 'Rose';
}
