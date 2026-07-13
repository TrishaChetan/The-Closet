// styleProfiles.js
//
// Style profiles are hand-authored rule sets describing an aesthetic in terms
// of colour palette, preferred formality, and pairing tendencies. They are
// written from general style/colour theory and public style vocabulary
// (e.g. "preppy," "grunge," "y2k") — never derived from any individual
// person's copyrighted photos or likeness. Add your own by pushing a new
// object into STYLE_PROFILES below; nothing else in the app needs to change.

export const STYLE_PROFILES = [
  {
    id: 'old-money',
    label: 'Old Money',
    description: 'Elegant, timeless luxury — blazers, loafers, knitwear, pleated trousers, pearls.',
    paletteHues: [
      { name: 'Navy', hue: 220, tolerance: 25 },
      { name: 'Camel/Cream', hue: 40, tolerance: 22 },
      { name: 'Hunter Green', hue: 140, tolerance: 20 }
    ],
    neutralsBonus: true,
    formalityBias: 'formal',
    tagBonus: ['blazer', 'loafer', 'knit', 'pleated', 'pearl', 'cashmere', 'tailored'],
    pairingNotes: 'Keep it understated — one quality neutral layer over another, minimal logos, polished footwear.'
  },
  {
    id: 'preppy',
    label: 'Preppy / Collegiate',
    description: 'Structured layers, tartan and rep-stripe patterns, jewel and neutral tones, polished but never flashy.',
    paletteHues: [
      { name: 'Navy', hue: 220, tolerance: 25 },
      { name: 'Hunter Green', hue: 140, tolerance: 25 },
      { name: 'Burgundy', hue: 350, tolerance: 20 },
      { name: 'Camel/Cream', hue: 40, tolerance: 25 },
      { name: 'Blush', hue: 340, tolerance: 20 }
    ],
    neutralsBonus: true,
    formalityBias: 'smart-casual',
    tagBonus: ['plaid', 'tartan', 'wool', 'knit', 'collar', 'monogram', 'tweed', 'rep-stripe'],
    pairingNotes: 'Pair a structured piece (blazer, collared shirt) with one relaxed piece. Keep loud patterns to one item.'
  },
  {
    id: 'coquette',
    label: 'Coquette',
    description: 'Feminine and romantic — lace, bows, ribbons, ballet flats, cardigans, pastel dresses.',
    paletteHues: [
      { name: 'Blush', hue: 340, tolerance: 25 },
      { name: 'Cream', hue: 40, tolerance: 20 },
      { name: 'Powder Blue', hue: 200, tolerance: 20 }
    ],
    neutralsBonus: true,
    formalityBias: 'smart-casual',
    tagBonus: ['lace', 'bow', 'ribbon', 'ballet', 'cardigan', 'pastel', 'frill'],
    pairingNotes: 'Lean into soft pastels and one delicate detail (a bow, lace trim) rather than piling on several.'
  },
  {
    id: 'y2k',
    label: 'Y2K',
    description: 'Early-2000s nostalgia — baby tees, low-rise, mini skirts, rhinestones, baguette bags.',
    paletteHues: [
      { name: 'Hot Pink', hue: 330, tolerance: 25 },
      { name: 'Sky Blue', hue: 200, tolerance: 20 },
      { name: 'Silver/Grey', hue: 0, tolerance: 360 }
    ],
    neutralsBonus: false,
    formalityBias: 'casual',
    tagBonus: ['rhinestone', 'baby tee', 'low-rise', 'shiny', 'metallic', 'baguette'],
    pairingNotes: 'Mix a bold colour or shine with one denim or grey basic so it doesn\u2019t compete with itself.'
  },
  {
    id: 'clean-girl',
    label: 'Clean Girl',
    description: 'Minimal and polished — neutral basics, gold hoops, white sneakers, slicked-back styling.',
    paletteHues: [
      { name: 'White', hue: 0, tolerance: 360 },
      { name: 'Beige', hue: 40, tolerance: 20 },
      { name: 'Grey', hue: 0, tolerance: 360 }
    ],
    neutralsBonus: true,
    formalityBias: 'smart-casual',
    tagBonus: ['basic', 'minimal', 'gold', 'sneaker', 'oversized blazer'],
    pairingNotes: 'Stick to two tones max and let fit and fabric quality carry the look.'
  },
  {
    id: 'dark-academia',
    label: 'Dark Academia',
    description: 'Vintage-intellectual — tweed blazers, turtlenecks, plaid skirts, loafers, trench coats.',
    paletteHues: [
      { name: 'Deep Brown', hue: 30, tolerance: 20 },
      { name: 'Burgundy', hue: 350, tolerance: 20 },
      { name: 'Charcoal', hue: 0, tolerance: 360 }
    ],
    neutralsBonus: true,
    formalityBias: 'smart-casual',
    tagBonus: ['tweed', 'turtleneck', 'plaid', 'loafer', 'trench', 'vintage'],
    pairingNotes: 'Layer at least two pieces (shirt + sweater, or blazer + turtleneck) in warm, muted, library tones.'
  },
  {
    id: 'light-academia',
    label: 'Light Academia',
    description: 'Soft scholarly — beige cardigans, linen trousers, oxford shirts, cream tones.',
    paletteHues: [
      { name: 'Cream', hue: 40, tolerance: 25 },
      { name: 'Beige', hue: 35, tolerance: 20 },
      { name: 'Soft Grey', hue: 0, tolerance: 360 }
    ],
    neutralsBonus: true,
    formalityBias: 'smart-casual',
    tagBonus: ['linen', 'cardigan', 'oxford', 'cream'],
    pairingNotes: 'Keep the whole palette light and warm-neutral — this profile avoids high-contrast or dark pairings.'
  },
  {
    id: 'streetwear',
    label: 'Streetwear',
    description: 'Oversized silhouettes, bold graphics, one statement colour against neutrals, sneaker-forward.',
    paletteHues: [
      { name: 'Black', hue: 0, tolerance: 360 },
      { name: 'Grey', hue: 0, tolerance: 360 }
    ],
    neutralsBonus: true,
    formalityBias: 'casual',
    tagBonus: ['oversized', 'graphic', 'logo', 'sneaker', 'cargo', 'hoodie', 'cap'],
    pairingNotes: 'Anchor with neutrals and let one item carry all the colour or graphic energy.'
  },
  {
    id: 'goth',
    label: 'Goth',
    description: 'Dark and dramatic — black lace, leather jackets, combat boots, silver jewelry.',
    paletteHues: [
      { name: 'Black', hue: 0, tolerance: 360 },
      { name: 'Deep Burgundy', hue: 350, tolerance: 15 }
    ],
    neutralsBonus: true,
    formalityBias: 'casual',
    tagBonus: ['leather', 'lace', 'combat boot', 'silver', 'buckle', 'velvet'],
    pairingNotes: 'Stay almost entirely in black with a single deep accent colour or metal-tone accessory.'
  },
  {
    id: 'cottagecore',
    label: 'Cottagecore',
    description: 'Countryside romance — floral dresses, puff sleeves, baskets, lace, straw hats.',
    paletteHues: [
      { name: 'Sage', hue: 100, tolerance: 25 },
      { name: 'Cream', hue: 40, tolerance: 25 },
      { name: 'Dusty Rose', hue: 340, tolerance: 20 }
    ],
    neutralsBonus: true,
    formalityBias: 'casual',
    tagBonus: ['floral', 'linen', 'puff sleeve', 'straw', 'gingham', 'lace'],
    pairingNotes: 'Reach for muted, earthy pastels and natural fabrics over anything shiny or synthetic-looking.'
  },
  {
    id: 'grunge',
    label: 'Grunge',
    description: "'90s rebellious — flannel shirts, ripped jeans, band tees, combat boots.",
    paletteHues: [
      { name: 'Charcoal', hue: 0, tolerance: 360 },
      { name: 'Deep Red', hue: 0, tolerance: 20 },
      { name: 'Olive', hue: 80, tolerance: 20 }
    ],
    neutralsBonus: true,
    formalityBias: 'casual',
    tagBonus: ['flannel', 'ripped', 'band tee', 'combat boot', 'denim', 'distressed'],
    pairingNotes: 'Mix textures (denim + flannel + leather) more than colours — deliberately undone, not matchy.'
  },
  {
    id: 'boho',
    label: 'Boho',
    description: 'Free-spirited — maxi skirts, crochet tops, fringe bags, layered necklaces.',
    paletteHues: [
      { name: 'Terracotta', hue: 20, tolerance: 20 },
      { name: 'Mustard', hue: 50, tolerance: 20 },
      { name: 'Cream', hue: 40, tolerance: 25 }
    ],
    neutralsBonus: true,
    formalityBias: 'casual',
    tagBonus: ['crochet', 'fringe', 'maxi', 'layered', 'suede', 'embroidered'],
    pairingNotes: 'Layer accessories freely (necklaces, bags) — this is the one profile where "more" reads as intentional.'
  },
  {
    id: 'fairycore',
    label: 'Fairycore',
    description: 'Whimsical fantasy — flowy dresses, butterfly accessories, sheer fabrics, earthy pastels.',
    paletteHues: [
      { name: 'Lavender', hue: 270, tolerance: 20 },
      { name: 'Mint', hue: 150, tolerance: 20 },
      { name: 'Blush', hue: 340, tolerance: 20 }
    ],
    neutralsBonus: true,
    formalityBias: 'casual',
    tagBonus: ['sheer', 'flowy', 'butterfly', 'sparkle', 'pastel'],
    pairingNotes: 'Favour soft, flowing shapes and light pastel-to-earth tones over anything structured or bold.'
  },
  {
    id: 'casual-everyday',
    label: 'Casual Everyday',
    description: 'Comfortable, easy pairings — the closet\u2019s default lens if you don\u2019t pick a theme.',
    paletteHues: [],
    neutralsBonus: true,
    formalityBias: 'casual',
    tagBonus: [],
    pairingNotes: 'Simple contrast and comfort — no strict rules.'
  }
];

export function getProfile(id) {
  return STYLE_PROFILES.find((p) => p.id === id) || STYLE_PROFILES[STYLE_PROFILES.length - 1];
}

// ---------- colour harmony helpers (used by matcher.js) ----------

const NEUTRAL_NAMES = new Set(['Black', 'White', 'Grey', 'Charcoal', 'Cream', 'Navy']);

export function isNeutral(colorName) {
  return NEUTRAL_NAMES.has(colorName);
}

/** Returns a 0-1 harmony score between two hues using basic colour-wheel relationships. */
export function hueHarmonyScore(hueA, hueB) {
  if (hueA == null || hueB == null) return 0.5;
  const diff = Math.min(Math.abs(hueA - hueB), 360 - Math.abs(hueA - hueB));
  const analogous = 1 - Math.min(diff, 40) / 40;
  const complementary = 1 - Math.min(Math.abs(diff - 180), 40) / 40;
  return Math.max(analogous, complementary * 0.85);
}

export function profileHueBonus(profile, hue) {
  if (!profile || !profile.paletteHues || profile.paletteHues.length === 0) return 0;
  let best = 0;
  for (const p of profile.paletteHues) {
    const diff = Math.min(Math.abs(hue - p.hue), 360 - Math.abs(hue - p.hue));
    if (diff <= p.tolerance) {
      best = Math.max(best, 1 - diff / p.tolerance);
    }
  }
  return best;
}
