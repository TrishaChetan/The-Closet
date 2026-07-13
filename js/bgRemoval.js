// bgRemoval.js — free, local background removal.
//
// This is NOT a full ML segmentation model (that would need a large model
// download and real compute). Instead it's a chroma-key style cutout: it
// samples the color at the photo's corners (assumed to be background, per
// the "shoot on a plain surface" guidance in the README/app), then makes
// any pixel close to that color transparent. Works well for plain
// backgrounds; for busy/patterned backgrounds, the Settings/Add Item screen
// points people to their phone's built-in subject-lift tool instead.

/**
 * Returns a new data URL with the background made transparent.
 * @param {HTMLImageElement} imgEl - loaded image
 * @param {number} tolerance - 0-100, how aggressively to cut (higher = more removed)
 */
export function removeBackground(imgEl, tolerance = 32) {
  const canvas = document.createElement('canvas');
  const w = canvas.width = imgEl.naturalWidth || imgEl.width;
  const h = canvas.height = imgEl.naturalHeight || imgEl.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imgEl, 0, 0, w, h);

  let imageData;
  try {
    imageData = ctx.getImageData(0, 0, w, h);
  } catch (e) {
    return null; // tainted canvas (cross-origin) — caller should fall back to original photo
  }
  const data = imageData.data;

  const bg = sampleBackgroundColor(data, w, h);
  const tol = tolerance; // in the same 0-255-ish distance space used below

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dist = colorDistance(r, g, b, bg.r, bg.g, bg.b);
    if (dist < tol) {
      data[i + 3] = 0; // fully transparent
    } else if (dist < tol * 1.6) {
      // Soft edge band so the cutout doesn't look jagged/pixelated
      const t = (dist - tol) / (tol * 0.6);
      data[i + 3] = Math.round(255 * Math.min(1, Math.max(0, t)));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

function sampleBackgroundColor(data, w, h) {
  // Average a handful of corner/edge patches — plain backgrounds are usually
  // most visible there, since the garment tends to sit centered in frame.
  const patches = [
    [0, 0], [w - 12, 0], [0, h - 12], [w - 12, h - 12],
    [Math.floor(w / 2) - 6, 0], [0, Math.floor(h / 2) - 6]
  ];
  let r = 0, g = 0, b = 0, count = 0;
  for (const [px, py] of patches) {
    for (let y = py; y < py + 10 && y < h; y++) {
      for (let x = px; x < px + 10 && x < w; x++) {
        if (x < 0 || y < 0) continue;
        const idx = (y * w + x) * 4;
        r += data[idx]; g += data[idx + 1]; b += data[idx + 2];
        count++;
      }
    }
  }
  if (count === 0) return { r: 255, g: 255, b: 255 };
  return { r: r / count, g: g / count, b: b / count };
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}
