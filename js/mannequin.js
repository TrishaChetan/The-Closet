// mannequin.js — builds a stylized, non-photographic paper-doll SVG.
// Deliberately NOT a photo/likeness of the user: a flat illustrated figure
// parameterized by real body measurements (in cm), skin tone, eyes, and
// hair. Garments are rendered using the ACTUAL photographed item, clipped
// into the correct body-shaped region — so it reads as "wearing that
// piece," not a flat color block. Falls back to a solid color fill only if
// an item has no photo.

const W = 300, H = 520;
const CENTER_X = 150;
const HEAD_CY = 58, HEAD_R = 38;
const SHOULDER_Y = 96, BUST_Y = 150, WAIST_Y = 248, HIP_Y = 300;
const KNEE_Y_BASE = 400, ANKLE_Y_BASE = 488;
const REFERENCE_HEIGHT_CM = 165;

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function mapRange(value, inMin, inMax, outMin, outMax) {
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
}

let clipCounter = 0;

export function buildMannequinSVG(params, outfitByCategory) {
  clipCounter = 0;
  const {
    gender = 'unisex',
    heightCm = 165, bustCm = 90, waistCm = 75, hipCm = 95, thighCm = 52, buttCm = 95,
    skinTone = '#C68863',
    eyeColor = '#5B4636',
    hairStyle = 'wavy-shoulder', hairColor = '#2B1B12'
  } = params || {};

  const bustHalf = mapRange(bustCm, 76, 127, 45, 78);
  const waistHalf = mapRange(waistCm, 56, 107, 32, 62);
  const hipHalfBase = mapRange(hipCm, 81, 132, 42, 80);
  const buttExtra = mapRange(buttCm, 81, 132, 0, 9);
  const hipHalf = hipHalfBase + buttExtra * 0.5;
  const thighHalf = mapRange(thighCm, 40, 70, 17, 33);
  const shoulderHalf = gender === 'masculine' ? bustHalf * 1.14 : gender === 'feminine' ? bustHalf * 0.94 : bustHalf * 1.02;

  const legScale = clamp(heightCm / REFERENCE_HEIGHT_CM, 0.85, 1.18);
  const kneeY = HIP_Y + (KNEE_Y_BASE - HIP_Y) * legScale;
  const ankleY = HIP_Y + (ANKLE_Y_BASE - HIP_Y) * legScale;

  const body = { bustHalf, waistHalf, hipHalf, thighHalf, shoulderHalf, kneeY, ankleY, skinTone };

  const parts = [];

  parts.push(hairBehind(hairStyle, hairColor));
  parts.push(bodySilhouette(body));
  parts.push(hairFront(hairStyle, hairColor));
  parts.push(eyesShape(eyeColor));

  const has = (cat) => outfitByCategory[cat];

  const dressCat = ['gowns', 'dresses-long', 'dresses-midi', 'dresses-short', 'jumpsuits'].find((c) => has(c));
  if (dressCat) {
    const hemY = { gowns: ankleY - 4, 'dresses-long': ankleY - 30, 'dresses-midi': kneeY + 40, 'dresses-short': kneeY - 30, jumpsuits: ankleY - 10 }[dressCat];
    parts.push(dressShape(outfitByCategory[dressCat], body, hemY));
  } else {
    if (has('skirts')) parts.push(skirtShape(outfitByCategory.skirts, body));
    if (has('shorts')) parts.push(shortsShape(outfitByCategory.shorts, body));
    if (has('jeans') || has('pants')) parts.push(pantsShape(outfitByCategory.jeans || outfitByCategory.pants, body));
    if (has('tops') || has('hoodies') || has('activewear')) {
      parts.push(topShape(outfitByCategory.tops || outfitByCategory.hoodies || outfitByCategory.activewear, body));
    }
  }
  if (has('footwear')) parts.push(footwearShape(outfitByCategory.footwear, body));
  if (has('blazers') || has('jackets')) parts.push(jacketShape(outfitByCategory.blazers || outfitByCategory.jackets, body));
  if (has('belts') && !dressCat) parts.push(beltShape(outfitByCategory.belts, body));
  if (has('scarves')) parts.push(scarfShape(outfitByCategory.scarves, body));
  if (has('necklace')) parts.push(necklaceShape(outfitByCategory.necklace, body));
  if (has('earrings')) parts.push(earringsShape(outfitByCategory.earrings));
  if (has('hats')) parts.push(hatShape(outfitByCategory.hats, body));
  if (has('glasses')) parts.push(glassesShape(outfitByCategory.glasses));
  if (has('watch')) parts.push(watchShape(outfitByCategory.watch, body));
  if (has('rings')) parts.push(ringsShape(outfitByCategory.rings, body));
  if (has('purses')) parts.push(purseShape(outfitByCategory.purses, body));

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stylized mannequin wearing the selected outfit">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#F7F3EC"/>
    ${parts.join('\n')}
  </svg>`;
}

// ---------------- garment rendering: clip the real photo into the shape ----------------

function clippedRegion(pathD, bbox, item, fallbackColor) {
  const photo = item && item.photo;
  if (!photo) {
    return `<path d="${pathD}" fill="${item?.color?.hex || fallbackColor}"/>`;
  }
  const id = `mq-clip-${clipCounter++}`;
  return `
    <clipPath id="${id}"><path d="${pathD}"/></clipPath>
    <g clip-path="url(#${id})">
      <image href="${photo}" x="${bbox.x}" y="${bbox.y}" width="${bbox.w}" height="${bbox.h}" preserveAspectRatio="xMidYMid slice"/>
    </g>
    <path d="${pathD}" fill="none" stroke="rgba(20,20,20,0.08)" stroke-width="1"/>
  `;
}

// ---------------- body ----------------

function bodySilhouette({ shoulderHalf, bustHalf, waistHalf, hipHalf, thighHalf, kneeY, ankleY, skinTone }) {
  const midBW = (SHOULDER_Y + BUST_Y) / 2, midBustWaist = (BUST_Y + WAIST_Y) / 2, midWaistHip = (WAIST_Y + HIP_Y) / 2;
  const midHipKnee = (HIP_Y + kneeY) / 2, midKneeAnkle = (kneeY + ankleY) / 2;

  const path = `
    M ${CENTER_X - shoulderHalf} ${SHOULDER_Y}
    Q ${CENTER_X - bustHalf * 1.06} ${midBW} ${CENTER_X - bustHalf} ${BUST_Y}
    Q ${CENTER_X - waistHalf * 1.08} ${midBustWaist} ${CENTER_X - waistHalf} ${WAIST_Y}
    Q ${CENTER_X - hipHalf * 1.1} ${midWaistHip} ${CENTER_X - hipHalf} ${HIP_Y}
    Q ${CENTER_X - hipHalf * 0.8} ${midHipKnee} ${CENTER_X - thighHalf} ${kneeY}
    Q ${CENTER_X - thighHalf * 0.85} ${midKneeAnkle} ${CENTER_X - thighHalf * 0.55} ${ankleY}
    L ${CENTER_X - thighHalf * 0.32} ${ankleY}
    Q ${CENTER_X - thighHalf * 0.42} ${midKneeAnkle} ${CENTER_X - thighHalf * 0.3} ${kneeY}
    L ${CENTER_X - 5} ${HIP_Y + 6}
    L ${CENTER_X + 5} ${HIP_Y + 6}
    Q ${CENTER_X + thighHalf * 0.3} ${midKneeAnkle} ${CENTER_X + thighHalf * 0.42} ${kneeY}
    L ${CENTER_X + thighHalf * 0.32} ${ankleY}
    L ${CENTER_X + thighHalf * 0.55} ${ankleY}
    Q ${CENTER_X + thighHalf * 0.85} ${midKneeAnkle} ${CENTER_X + thighHalf} ${kneeY}
    Q ${CENTER_X + hipHalf * 0.8} ${midHipKnee} ${CENTER_X + hipHalf} ${HIP_Y}
    Q ${CENTER_X + waistHalf * 1.08} ${midWaistHip} ${CENTER_X + waistHalf} ${WAIST_Y}
    Q ${CENTER_X + bustHalf * 1.06} ${midBustWaist} ${CENTER_X + bustHalf} ${BUST_Y}
    Q ${CENTER_X + shoulderHalf * 1.02} ${midBW} ${CENTER_X + shoulderHalf} ${SHOULDER_Y}
    Z`;

  const arm = (side) => `
    M ${CENTER_X + side * shoulderHalf * 0.94} ${SHOULDER_Y + 4}
    Q ${CENTER_X + side * (shoulderHalf + 20)} ${(SHOULDER_Y + 220) / 2} ${CENTER_X + side * (shoulderHalf + 18)} 222
    L ${CENTER_X + side * (shoulderHalf + 6)} 226
    Q ${CENTER_X + side * (bustHalf + 4)} ${(SHOULDER_Y + 222) / 2} ${CENTER_X + side * bustHalf * 0.96} ${SHOULDER_Y + 10}
    Z`;

  return `
    <circle cx="${CENTER_X}" cy="${HEAD_CY}" r="${HEAD_R}" fill="${skinTone}"/>
    <rect x="${CENTER_X - 13}" y="${HEAD_CY + HEAD_R - 6}" width="26" height="22" fill="${skinTone}"/>
    <path d="${path}" fill="${skinTone}"/>
    <path d="${arm(-1)}" fill="${skinTone}"/>
    <path d="${arm(1)}" fill="${skinTone}"/>
    <circle cx="${CENTER_X - (shoulderHalf + 14)}" cy="224" r="8.5" fill="${skinTone}"/>
    <circle cx="${CENTER_X + (shoulderHalf + 14)}" cy="224" r="8.5" fill="${skinTone}"/>
    <ellipse cx="${CENTER_X - thighHalf * 0.4}" cy="${ankleY + 6}" rx="13" ry="6" fill="${skinTone}"/>
    <ellipse cx="${CENTER_X + thighHalf * 0.4}" cy="${ankleY + 6}" rx="13" ry="6" fill="${skinTone}"/>
  `;
}

function eyesShape(eyeColor) {
  const mkEye = (cx) => `
    <path d="M ${cx - 9} 58 Q ${cx} 51 ${cx + 9} 58 Q ${cx} 65 ${cx - 9} 58 Z" fill="#FFFFFF" stroke="#3a2c22" stroke-width="0.8"/>
    <circle cx="${cx}" cy="58" r="4.4" fill="${eyeColor}"/>
    <circle cx="${cx}" cy="58" r="1.9" fill="#161616"/>
    <circle cx="${cx + 1.2}" cy="56.5" r="0.9" fill="#ffffff" opacity="0.8"/>
    <path d="M ${cx - 9} 58 Q ${cx} 51.5 ${cx + 9} 58" fill="none" stroke="#2a2018" stroke-width="1.3"/>
  `;
  return mkEye(CENTER_X - 14) + mkEye(CENTER_X + 14);
}

// ---------------- hair ----------------

function hairBehind(style, color) {
  if (style === 'curly-afro') return `<circle cx="${CENTER_X}" cy="${HEAD_CY}" r="48" fill="${color}"/>`;
  if (style === 'coily-afro') {
    let bumps = `<circle cx="${CENTER_X}" cy="${HEAD_CY}" r="54" fill="${color}"/>`;
    for (let a = 0; a < 360; a += 28) {
      const rad = (a * Math.PI) / 180;
      const bx = CENTER_X + Math.cos(rad) * 52, by = HEAD_CY + Math.sin(rad) * 52;
      bumps += `<circle cx="${bx}" cy="${by}" r="9" fill="${color}"/>`;
    }
    return bumps;
  }
  if (style === 'ponytail') {
    return `
      <path d="M ${CENTER_X + 24} 40 Q ${CENTER_X + 40} 60 ${CENTER_X + 30} 100
               Q ${CENTER_X + 22} 160 ${CENTER_X + 26} 220
               Q ${CENTER_X + 28} 250 ${CENTER_X + 18} 260
               Q ${CENTER_X + 10} 200 ${CENTER_X + 14} 130
               Q ${CENTER_X + 16} 70 ${CENTER_X + 10} 42 Z" fill="${color}"/>
      <rect x="${CENTER_X + 10}" y="38" width="16" height="8" rx="3" fill="${color}" opacity="0.85"/>`;
  }
  if (style === 'bun') {
    return `<circle cx="${CENTER_X}" cy="18" r="16" fill="${color}"/>`;
  }
  return '';
}

function hairFront(style, color) {
  const cap = `M 108 58 A 44 44 0 0 1 192 58 L 188 50 A 38 38 0 0 0 112 50 Z`;
  const thinCap = `M 112 55 A 40 40 0 0 1 188 55 L 186 49 A 36 36 0 0 0 114 49 Z`;

  const sideExt = (len, wave) => {
    const curl = wave === 'curly' ? `q 8 8 0 16 q -8 8 0 16 q 8 8 0 16`
      : wave === 'wavy' ? `q 10 12 0 24 q -10 12 0 24`
      : '';
    const extra = wave === 'curly' ? 48 : wave === 'wavy' ? 24 : 0;
    const left = `M 108 58 L 105 ${len} ${curl} L 118 ${len + extra} L 116 60 Z`;
    const right = `M 192 58 L 195 ${len} ${curl} L 182 ${len + extra} L 184 60 Z`;
    return `<path d="${left}" fill="${color}"/><path d="${right}" fill="${color}"/>`;
  };

  switch (style) {
    case 'buzzcut':
      return `<path d="${thinCap}" fill="${color}"/>`;
    case 'undercut':
      return `<path d="${thinCap}" fill="${color}"/>
              <path d="M 118 46 Q 150 32 182 46 L 178 54 Q 150 42 122 54 Z" fill="${color}"/>`;
    case 'short-crop':
      return `<path d="${cap}" fill="${color}"/>${sideExt(78, 'straight')}`;
    case 'bob':
      return `<path d="${cap}" fill="${color}"/>${sideExt(112, 'straight')}`;
    case 'long-straight':
      return `<path d="${cap}" fill="${color}"/>${sideExt(210, 'straight')}`;
    case 'wavy-shoulder':
      return `<path d="${cap}" fill="${color}"/>${sideExt(135, 'wavy')}`;
    case 'long-curly':
      return `<path d="${cap}" fill="${color}"/>${sideExt(195, 'curly')}`;
    case 'curly-afro':
    case 'coily-afro':
      return `<circle cx="${CENTER_X}" cy="28" r="20" fill="${color}"/>`;
    case 'ponytail':
      return `<path d="${cap}" fill="${color}"/>${sideExt(66, 'straight')}`;
    case 'braids': {
      const braid = (side) => {
        let d = `M ${CENTER_X + side * 40} 60 `;
        const seg = 26;
        for (let i = 1; i <= 6; i++) d += `L ${CENTER_X + side * (40 - (i % 2 ? 4 : -4))} ${60 + seg * i} `;
        return `<path d="${d}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>`;
      };
      return `<path d="${cap}" fill="${color}"/>${braid(-1)}${braid(1)}`;
    }
    case 'bun':
      return `<path d="${cap}" fill="${color}"/>${sideExt(70, 'straight')}`;
    default:
      return `<path d="${cap}" fill="${color}"/>${sideExt(120, 'wavy')}`;
  }
}

// ---------------- garments ----------------

function topShape(item, { shoulderHalf, bustHalf, waistHalf }) {
  const hemY = HIP_Y - 4;
  const d = `M ${CENTER_X - shoulderHalf * 0.96} ${SHOULDER_Y + 2}
    L ${CENTER_X - bustHalf * 1.04} ${BUST_Y}
    L ${CENTER_X - waistHalf * 1.08} ${hemY}
    L ${CENTER_X + waistHalf * 1.08} ${hemY}
    L ${CENTER_X + bustHalf * 1.04} ${BUST_Y}
    L ${CENTER_X + shoulderHalf * 0.96} ${SHOULDER_Y + 2}
    Z`;
  const bbox = { x: CENTER_X - bustHalf * 1.1, y: SHOULDER_Y, w: bustHalf * 2.2, h: hemY - SHOULDER_Y };
  return clippedRegion(d, bbox, item, '#8891A5');
}

function jacketShape(item, { shoulderHalf, bustHalf, waistHalf }) {
  const hemY = HIP_Y - 2;
  const dL = `M ${CENTER_X - shoulderHalf * 1.1} ${SHOULDER_Y - 2}
    L ${CENTER_X - bustHalf * 1.18} ${BUST_Y + 4}
    L ${CENTER_X - waistHalf * 1.22} ${hemY}
    L ${CENTER_X - 6} ${hemY}
    L ${CENTER_X - 10} ${BUST_Y}
    L ${CENTER_X - shoulderHalf * 0.5} ${SHOULDER_Y}
    Z`;
  const dR = `M ${CENTER_X + shoulderHalf * 1.1} ${SHOULDER_Y - 2}
    L ${CENTER_X + bustHalf * 1.18} ${BUST_Y + 4}
    L ${CENTER_X + waistHalf * 1.22} ${hemY}
    L ${CENTER_X + 6} ${hemY}
    L ${CENTER_X + 10} ${BUST_Y}
    L ${CENTER_X + shoulderHalf * 0.5} ${SHOULDER_Y}
    Z`;
  const bboxL = { x: CENTER_X - bustHalf * 1.25, y: SHOULDER_Y - 5, w: bustHalf * 1.3, h: hemY - SHOULDER_Y + 5 };
  const bboxR = { x: CENTER_X - 10, y: SHOULDER_Y - 5, w: bustHalf * 1.3, h: hemY - SHOULDER_Y + 5 };
  return clippedRegion(dL, bboxL, item, '#3B4252') + clippedRegion(dR, bboxR, item, '#3B4252');
}

function pantsShape(item, { hipHalf, thighHalf, kneeY, ankleY, skinTone }) {
  const dL = `M ${CENTER_X - hipHalf} ${HIP_Y}
    L ${CENTER_X - thighHalf} ${kneeY}
    L ${CENTER_X - thighHalf * 0.55} ${ankleY}
    L ${CENTER_X - thighHalf * 0.3} ${ankleY}
    L ${CENTER_X - thighHalf * 0.25} ${kneeY}
    L ${CENTER_X - 3} ${HIP_Y + 6}
    Z`;
  const dR = `M ${CENTER_X + hipHalf} ${HIP_Y}
    L ${CENTER_X + thighHalf} ${kneeY}
    L ${CENTER_X + thighHalf * 0.55} ${ankleY}
    L ${CENTER_X + thighHalf * 0.3} ${ankleY}
    L ${CENTER_X + thighHalf * 0.25} ${kneeY}
    L ${CENTER_X + 3} ${HIP_Y + 6}
    Z`;
  const gusset = `<rect x="${CENTER_X - 3}" y="${HIP_Y}" width="6" height="${ankleY - HIP_Y + 10}" fill="${skinTone || '#C68863'}"/>`;
  const bbox = { x: CENTER_X - hipHalf, y: HIP_Y - 10, w: hipHalf * 2, h: ankleY - HIP_Y + 20 };
  return gusset + clippedRegion(dL, bbox, item, '#33475B') + clippedRegion(dR, bbox, item, '#33475B');
}

function shortsShape(item, { hipHalf }) {
  const hemY = HIP_Y + 55;
  const dL = `M ${CENTER_X - hipHalf} ${HIP_Y - 8} L ${CENTER_X - hipHalf * 0.68} ${hemY} L ${CENTER_X - 6} ${hemY} L ${CENTER_X - 5} ${HIP_Y + 4} Z`;
  const dR = `M ${CENTER_X + hipHalf} ${HIP_Y - 8} L ${CENTER_X + hipHalf * 0.68} ${hemY} L ${CENTER_X + 6} ${hemY} L ${CENTER_X + 5} ${HIP_Y + 4} Z`;
  const bbox = { x: CENTER_X - hipHalf, y: HIP_Y - 10, w: hipHalf * 2, h: 68 };
  return clippedRegion(dL, bbox, item, '#33475B') + clippedRegion(dR, bbox, item, '#33475B');
}

function skirtShape(item, { hipHalf }) {
  const hemY = HIP_Y + 95;
  const d = `M ${CENTER_X - hipHalf} ${HIP_Y - 8} L ${CENTER_X - hipHalf * 1.18} ${hemY} L ${CENTER_X + hipHalf * 1.18} ${hemY} L ${CENTER_X + hipHalf} ${HIP_Y - 8} Z`;
  const bbox = { x: CENTER_X - hipHalf * 1.2, y: HIP_Y - 10, w: hipHalf * 2.4, h: 105 };
  return clippedRegion(d, bbox, item, '#7A4B5E');
}

function dressShape(item, { shoulderHalf, bustHalf, waistHalf, hipHalf }, hemY) {
  const d = `M ${CENTER_X - shoulderHalf * 0.96} ${SHOULDER_Y + 2}
    L ${CENTER_X - bustHalf * 1.04} ${BUST_Y}
    L ${CENTER_X - waistHalf * 1.06} ${WAIST_Y}
    L ${CENTER_X - hipHalf * 1.3} ${hemY}
    L ${CENTER_X + hipHalf * 1.3} ${hemY}
    L ${CENTER_X + waistHalf * 1.06} ${WAIST_Y}
    L ${CENTER_X + bustHalf * 1.04} ${BUST_Y}
    L ${CENTER_X + shoulderHalf * 0.96} ${SHOULDER_Y + 2}
    Z`;
  const bbox = { x: CENTER_X - hipHalf * 1.35, y: SHOULDER_Y, w: hipHalf * 2.7, h: hemY - SHOULDER_Y };
  return clippedRegion(d, bbox, item, '#7A4B5E');
}

function footwearShape(item, { thighHalf, ankleY }) {
  const mkShoe = (side) => {
    const cx = CENTER_X + side * thighHalf * 0.4;
    const d = `M ${cx - 15} ${ankleY + 3} L ${cx + 16} ${ankleY + 3} Q ${cx + 22} ${ankleY + 10} ${cx + 10} ${ankleY + 15} L ${cx - 15} ${ankleY + 15} Z`;
    const bbox = { x: cx - 16, y: ankleY, w: 40, h: 18 };
    return clippedRegion(d, bbox, item, '#2A2A2A');
  };
  return mkShoe(-1) + mkShoe(1);
}

function hatShape(item) {
  const d = `M ${CENTER_X - 46} 26 Q ${CENTER_X} -6 ${CENTER_X + 46} 26 Q ${CENTER_X} 40 ${CENTER_X - 46} 26 Z`;
  const bbox = { x: CENTER_X - 48, y: -8, w: 96, h: 48 };
  return clippedRegion(d, bbox, item, '#4A3B2C');
}

function glassesShape(item) {
  const c = item?.color?.hex || '#222222';
  return `<circle cx="${CENTER_X - 14}" cy="58" r="10" fill="none" stroke="${c}" stroke-width="3"/>
           <circle cx="${CENTER_X + 14}" cy="58" r="10" fill="none" stroke="${c}" stroke-width="3"/>
           <line x1="${CENTER_X - 4}" y1="58" x2="${CENTER_X + 4}" y2="58" stroke="${c}" stroke-width="3"/>`;
}

function necklaceShape(item) {
  const c = item?.color?.hex || '#C9A227';
  return `<path d="M ${CENTER_X - 18} 108 Q ${CENTER_X} 132 ${CENTER_X + 18} 108" fill="none" stroke="${c}" stroke-width="3"/>`;
}

function earringsShape(item) {
  const c = item?.color?.hex || '#C9A227';
  return `<circle cx="${CENTER_X - 37}" cy="66" r="3" fill="${c}"/><circle cx="${CENTER_X + 37}" cy="66" r="3" fill="${c}"/>`;
}

function scarfShape(item) {
  const d = `M ${CENTER_X - 28} ${SHOULDER_Y + 4} Q ${CENTER_X} ${SHOULDER_Y + 30} ${CENTER_X + 28} ${SHOULDER_Y + 4} L ${CENTER_X + 20} ${SHOULDER_Y + 26} Q ${CENTER_X} ${SHOULDER_Y + 40} ${CENTER_X - 20} ${SHOULDER_Y + 26} Z`;
  const bbox = { x: CENTER_X - 30, y: SHOULDER_Y, w: 60, h: 40 };
  return clippedRegion(d, bbox, item, '#9C4B4B');
}

function beltShape(item, { waistHalf }) {
  const c = item?.color?.hex || '#4A2E1F';
  return `<rect x="${CENTER_X - waistHalf * 1.05}" y="${WAIST_Y - 6}" width="${waistHalf * 2.1}" height="9" fill="${c}"/>`;
}

function watchShape(item, { shoulderHalf }) {
  const c = item?.color?.hex || '#8A8A8A';
  return `<rect x="${CENTER_X - shoulderHalf - 22}" y="220" width="11" height="9" fill="${c}"/>`;
}

function ringsShape(item, { shoulderHalf }) {
  const c = item?.color?.hex || '#C9A227';
  return `<circle cx="${CENTER_X - shoulderHalf - 16}" cy="230" r="2.5" fill="${c}"/>`;
}

function purseShape(item, { hipHalf }) {
  const d = `M ${CENTER_X + hipHalf + 6} 198 Q ${CENTER_X + hipHalf + 15} 176 ${CENTER_X + hipHalf + 24} 198 L ${CENTER_X + hipHalf + 32} 232 Q ${CENTER_X + hipHalf + 15} 240 ${CENTER_X + hipHalf - 2} 232 Z`;
  const bbox = { x: CENTER_X + hipHalf - 4, y: 176, w: 40, h: 64 };
  return clippedRegion(d, bbox, item, '#6B4A3A');
}
