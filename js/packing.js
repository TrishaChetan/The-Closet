// packing.js — plan a capsule suitcase for a trip.
// Picks the fewest tops/bottoms/dresses that still give a different, colour-
// coordinated outfit for each day, then lays out a day-by-day plan.
// Pure functions, no DOM — easy to test.

import { scorePair, TOP_LIKE, BOTTOM_LIKE, DRESS_LIKE, OUTER_LAYER } from './matcher.js';
import { getProfile } from './styleProfiles.js';

const FORMALITY_RANK = { casual: 0, 'smart-casual': 1, formal: 2 };
const GOOD_PAIR = 0.6; // scorePair threshold for "these go together"

function fitsDressCode(item, dressCode) {
  if (!dressCode || dressCode === 'any') return true;
  const have = FORMALITY_RANK[item.formality] ?? 0;
  return Math.abs(have - FORMALITY_RANK[dressCode]) <= 1;
}

/**
 * @param {Array} items     wearable closet items
 * @param {object} opts     { days, dressCode: 'any'|'casual'|'smart-casual'|'formal', profileId }
 * @returns {{ pieces, plan, outfitCount, note }}
 */
export function planTrip(items, { days = 3, dressCode = 'any', profileId = null } = {}) {
  days = Math.max(1, Math.min(30, Math.round(days)));
  const profile = getProfile(profileId);
  let pool = items.filter((i) => fitsDressCode(i, dressCode));
  if (dressCode === 'any') {
    // "Mixed" trips skip gowns and other formal-only pieces unless that's all there is.
    const everyday = pool.filter((i) => i.formality !== 'formal');
    const usable = everyday.some((i) => DRESS_LIKE.includes(i.category)) ||
      (everyday.some((i) => TOP_LIKE.includes(i.category)) && everyday.some((i) => BOTTOM_LIKE.includes(i.category)));
    if (usable) pool = everyday;
  }
  const tops = pool.filter((i) => TOP_LIKE.includes(i.category));
  const bottoms = pool.filter((i) => BOTTOM_LIKE.includes(i.category));
  const dresses = pool.filter((i) => DRESS_LIKE.includes(i.category));

  if (!dresses.length && !(tops.length && bottoms.length)) {
    return { pieces: [], plan: [], outfitCount: 0,
      note: 'Add at least one top and one bottom (or a dress/jumpsuit) that fits this dress code.' };
  }

  // Pair scores; if nothing clears the bar, fall back to "anything goes".
  const pairScore = new Map();
  let anyGood = false;
  for (const t of tops) for (const b of bottoms) {
    const s = scorePair(t, b, profile);
    pairScore.set(t.id + '|' + b.id, s);
    if (s >= GOOD_PAIR) anyGood = true;
  }
  const goes = (t, b) => (pairScore.get(t.id + '|' + b.id) ?? -1) >= (anyGood ? GOOD_PAIR : -Infinity);

  // How many partners an item has across the whole closet — a tiebreak for versatility.
  const versatility = new Map();
  for (const t of tops) versatility.set(t.id, bottoms.filter((b) => goes(t, b)).length);
  for (const b of bottoms) versatility.set(b.id, tops.filter((t) => goes(t, b)).length);
  for (const d of dresses) versatility.set(d.id, 1);

  const packed = [];
  const isPacked = (i) => packed.includes(i);
  const outfitsOf = (set) => {
    const out = [];
    for (const t of set.filter((i) => TOP_LIKE.includes(i.category)))
      for (const b of set.filter((i) => BOTTOM_LIKE.includes(i.category)))
        if (goes(t, b)) out.push({ pieces: [t, b], score: pairScore.get(t.id + '|' + b.id) });
    for (const d of set.filter((i) => DRESS_LIKE.includes(i.category))) out.push({ pieces: [d], score: 1 });
    return out;
  };

  // Greedy: each step adds the piece (or top+bottom pair) that unlocks the most
  // new outfits per piece packed. Ties go to separates, which keep mixing with
  // later additions, then to the more versatile piece.
  const candidates = [...tops, ...bottoms, ...dresses];
  const separate = (i) => !DRESS_LIKE.includes(i.category);
  while (outfitsOf(packed).length < days && packed.length < candidates.length) {
    const current = outfitsOf(packed).length;
    const moves = [];
    for (const c of candidates) {
      if (isPacked(c)) continue;
      moves.push({ add: [c], gain: outfitsOf([...packed, c]).length - current });
    }
    for (const t of tops) for (const b of bottoms) {
      if (isPacked(t) || isPacked(b) || !goes(t, b)) continue;
      moves.push({ add: [t, b], gain: outfitsOf([...packed, t, b]).length - current });
    }
    const rank = (m) => [m.gain / m.add.length, m.add.every(separate) ? 1 : 0,
      m.add.reduce((s, i) => s + (versatility.get(i.id) || 0), 0) / m.add.length];
    let best = null;
    for (const m of moves) {
      if (m.gain <= 0) continue;
      const r = rank(m);
      if (!best || r[0] > best.r[0] || (r[0] === best.r[0] && (r[1] > best.r[1] || (r[1] === best.r[1] && r[2] > best.r[2])))) {
        best = { m, r };
      }
    }
    if (!best) break;
    packed.push(...best.m.add);
  }

  const outfits = outfitsOf(packed).sort((a, b) => b.score - a.score);

  // Shoes and one outer layer: whichever goes best with what's packed.
  const avgWithPacked = (item) => packed.reduce((s, p) => s + scorePair(p, item, profile), 0) / packed.length;
  const extras = [];
  const shoes = pool.filter((i) => i.category === 'footwear').sort((a, b) => avgWithPacked(b) - avgWithPacked(a));
  extras.push(...shoes.slice(0, days >= 5 ? 2 : 1));
  const outer = pool.filter((i) => OUTER_LAYER.includes(i.category)).sort((a, b) => avgWithPacked(b) - avgWithPacked(a));
  if (outer.length) extras.push(outer[0]);

  // Day-by-day: least-worn outfit first, never the same top two days running.
  const used = new Map();
  const plan = [];
  let prev = null;
  for (let day = 1; day <= days; day++) {
    const ranked = [...outfits].sort((a, b) => (used.get(a) || 0) - (used.get(b) || 0) || b.score - a.score);
    const pick = ranked.find((o) => !prev || !o.pieces.some((p) => prev.pieces.includes(p))) || ranked[0];
    used.set(pick, (used.get(pick) || 0) + 1);
    plan.push({ day, pieces: pick.pieces });
    prev = pick;
  }

  const note = outfits.length < days
    ? `Your closet gives ${outfits.length} different outfit${outfits.length === 1 ? '' : 's'} for this dress code, so some get repeated.`
    : null;
  return { pieces: [...packed, ...extras], plan, outfitCount: outfits.length, note };
}

export function packingListText(result, days) {
  const lines = [`Packing list — ${days} day${days === 1 ? '' : 's'}`, ''];
  for (const p of result.pieces) lines.push(`[ ] ${p.name}`);
  lines.push('', 'Plan');
  for (const d of result.plan) lines.push(`Day ${d.day}: ${d.pieces.map((p) => p.name).join(' + ')}`);
  return lines.join('\n');
}
