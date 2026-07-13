// matcher.js — free, rule-based outfit composition.
// Uses colour theory + style-profile bias + formality/tag matching.
// No network call, no AI required for this to work.

import { isNeutral, hueHarmonyScore, profileHueBonus, getProfile } from './styleProfiles.js';

const FORMALITY_RANK = { casual: 0, 'smart-casual': 1, formal: 2 };

const TOP_LIKE = ['tops', 'hoodies', 'activewear'];
const OUTER_LAYER = ['blazers', 'jackets'];
const BOTTOM_LIKE = ['jeans', 'pants', 'shorts', 'skirts'];
// One-piece items stand in for a top + bottom combo at once.
const DRESS_LIKE = ['dresses-short', 'dresses-midi', 'dresses-long', 'gowns', 'jumpsuits'];
const ACCESSORY_SLOTS = ['footwear', 'hats', 'purses', 'belts', 'glasses', 'watch', 'rings', 'necklace', 'earrings', 'scarves'];
const ALL_SLOTS = [...TOP_LIKE, ...DRESS_LIKE, ...OUTER_LAYER, ...BOTTOM_LIKE, ...ACCESSORY_SLOTS];

function isDressLike(cat) { return DRESS_LIKE.includes(cat); }
function isTopOrBottom(cat) { return TOP_LIKE.includes(cat) || BOTTOM_LIKE.includes(cat); }

// A dress/jumpsuit conflicts with separate tops/bottoms and vice versa —
// you wouldn't wear a dress layered with a pair of jeans, for instance.
function categoriesConflict(catA, catB) {
  if (isDressLike(catA) && isTopOrBottom(catB)) return true;
  if (isTopOrBottom(catA) && isDressLike(catB)) return true;
  return false;
}

function scorePair(itemA, itemB, profile) {
  let score = 0;

  if (itemA.color && itemB.color) {
    if (isNeutral(itemA.color.name) || isNeutral(itemB.color.name)) {
      score += 0.5;
    } else {
      score += hueHarmonyScore(itemA.color.hue, itemB.color.hue) * 0.6;
    }
  }

  if (profile) {
    score += profileHueBonus(profile, itemA.color?.hue ?? 0) * 0.25;
    score += profileHueBonus(profile, itemB.color?.hue ?? 0) * 0.25;
  }

  const fa = FORMALITY_RANK[itemA.formality] ?? 0;
  const fb = FORMALITY_RANK[itemB.formality] ?? 0;
  score += (1 - Math.min(Math.abs(fa - fb), 2) / 2) * 0.4;

  if (profile?.tagBonus?.length) {
    const tagsA = (itemA.tags || []).map((t) => t.toLowerCase());
    const tagsB = (itemB.tags || []).map((t) => t.toLowerCase());
    const hit = profile.tagBonus.some((t) => tagsA.includes(t) || tagsB.includes(t));
    if (hit) score += 0.25;
  }

  return score;
}

/**
 * Build-around-item: given one anchor item and the full closet, suggest the
 * best complementary piece from every *other* compatible category.
 */
export function matchAroundItem(anchorItem, allItems, profileId) {
  const profile = getProfile(profileId);
  const others = allItems.filter((i) => i.id !== anchorItem.id);
  const byCategory = new Map();

  for (const item of others) {
    if (item.category === anchorItem.category) continue;
    if (categoriesConflict(anchorItem.category, item.category)) continue;
    const score = scorePair(anchorItem, item, profile);
    const current = byCategory.get(item.category);
    if (!current || score > current.score) {
      byCategory.set(item.category, { item, score });
    }
  }

  const picks = ALL_SLOTS
    .filter((cat) => cat !== anchorItem.category && byCategory.has(cat))
    .map((cat) => byCategory.get(cat));

  return { anchor: anchorItem, picks, profile };
}

/**
 * Full outfit composition for an occasion + weather, using the whole closet.
 * Considers two possible "bases" — a top+bottom combo, or a single dress/
 * jumpsuit — and picks whichever fits the occasion better (or whichever is
 * actually available in the closet).
 */
export function composeFullOutfit(allItems, { occasion, weather, profileId }) {
  const profile = getProfile(profileId);
  const targetFormality = occasionToFormality(occasion);
  const weatherFiltered = allItems.filter((item) => passesWeatherFilter(item, weather));

  if (weatherFiltered.length === 0) {
    return { picks: [], profile, note: 'Nothing in the closet suits that weather yet — try adding more items.' };
  }

  const base = pickBestBase(weatherFiltered, targetFormality, profile);
  if (!base) {
    return { picks: [], profile, note: 'Add at least one top + bottom, or one dress/jumpsuit, to compose a full outfit.' };
  }

  const picks = [...base.picks];
  const usedCategories = new Set(picks.map((p) => p.item.category));
  const outerNeeded = weather === 'cold' || weather === 'rainy';
  const accessoryCats = [...(outerNeeded ? OUTER_LAYER : []), ...ACCESSORY_SLOTS];

  for (const cat of accessoryCats) {
    if (usedCategories.has(cat)) continue;
    const candidates = weatherFiltered.filter((i) => i.category === cat);
    if (candidates.length === 0) continue;
    const ranked = candidates
      .map((item) => ({ item, score: picks.reduce((sum, p) => sum + scorePair(p.item, item, profile), 0) / picks.length }))
      .sort((a, b) => b.score - a.score);
    picks.push({ item: ranked[0].item, score: ranked[0].score });
  }

  return { picks, profile, note: null };
}

/** Chooses between a top+bottom base and a dress/jumpsuit base, whichever is available and fits better. */
function pickBestBase(items, targetFormality, profile) {
  const tops = items.filter((i) => TOP_LIKE.includes(i.category));
  const bottoms = items.filter((i) => BOTTOM_LIKE.includes(i.category));
  const dresses = items.filter((i) => DRESS_LIKE.includes(i.category));

  let topBottomOption = null;
  if (tops.length && bottoms.length) {
    const rankedTops = tops
      .map((item) => ({ item, score: formalityCloseness(item.formality, targetFormality) + profileHueBonus(profile, item.color?.hue ?? 0) * 0.3 }))
      .sort((a, b) => b.score - a.score);
    const bestTop = rankedTops[0].item;
    const rankedBottoms = bottoms
      .map((item) => ({ item, score: scorePair(bestTop, item, profile) }))
      .sort((a, b) => b.score - a.score);
    const bestBottom = rankedBottoms[0].item;
    const totalScore = rankedTops[0].score + rankedBottoms[0].score;
    topBottomOption = { picks: [{ item: bestTop, score: rankedTops[0].score }, { item: bestBottom, score: rankedBottoms[0].score }], totalScore };
  }

  let dressOption = null;
  if (dresses.length) {
    const rankedDresses = dresses
      .map((item) => ({ item, score: formalityCloseness(item.formality, targetFormality) + profileHueBonus(profile, item.color?.hue ?? 0) * 0.3 }))
      .sort((a, b) => b.score - a.score);
    const bestDress = rankedDresses[0].item;
    dressOption = { picks: [{ item: bestDress, score: rankedDresses[0].score }], totalScore: rankedDresses[0].score * 2 };
  }

  if (topBottomOption && dressOption) return topBottomOption.totalScore >= dressOption.totalScore ? topBottomOption : dressOption;
  return topBottomOption || dressOption || null;
}

/**
 * Random outfit: for when the user doesn't want to pick an anchor item at all.
 * Weighted toward coherence (formality + optional style profile) but samples
 * from the top few candidates per slot for real variety, and randomly chooses
 * between a top+bottom base or a dress/jumpsuit base when both exist.
 */
export function randomOutfit(allItems, { profileId } = {}) {
  const profile = profileId ? getProfile(profileId) : null;

  const tops = allItems.filter((i) => TOP_LIKE.includes(i.category));
  const bottoms = allItems.filter((i) => BOTTOM_LIKE.includes(i.category));
  const dresses = allItems.filter((i) => DRESS_LIKE.includes(i.category));

  const canTopBottom = tops.length > 0 && bottoms.length > 0;
  const canDress = dresses.length > 0;

  if (!canTopBottom && !canDress) {
    return { picks: [], profile, note: 'Add a top + bottom, or a dress/jumpsuit, before generating a random outfit.' };
  }

  const useDress = canDress && (!canTopBottom || Math.random() < 0.5);
  const picks = [];

  if (useDress) {
    const dress = weightedSample(dresses, (item) => 1 + profileHueBonus(profile, item.color?.hue ?? 0));
    picks.push({ item: dress, score: 1 });
  } else {
    const top = weightedSample(tops, (item) => 1 + profileHueBonus(profile, item.color?.hue ?? 0));
    const bottom = weightedSample(bottoms, (item) => 1 + scorePair(top, item, profile));
    picks.push({ item: top, score: 1 }, { item: bottom, score: 1 });
  }

  const usedCategories = new Set(picks.map((p) => p.item.category));
  for (const cat of [...OUTER_LAYER, ...ACCESSORY_SLOTS]) {
    if (usedCategories.has(cat)) continue;
    const candidates = allItems.filter((i) => i.category === cat);
    if (candidates.length === 0) continue;
    if (ACCESSORY_SLOTS.includes(cat) && Math.random() < 0.35) continue;
    const picked = weightedSample(candidates, (item) => 1 + picks.reduce((sum, p) => sum + scorePair(p.item, item, profile), 0));
    picks.push({ item: picked, score: 1 });
  }

  return { picks, profile, note: null };
}

function weightedSample(items, weightFn) {
  const ranked = items.map((item) => ({ item, weight: weightFn(item) })).sort((a, b) => b.weight - a.weight);
  const pool = ranked.slice(0, Math.min(3, ranked.length));
  return pool[Math.floor(Math.random() * pool.length)].item;
}

function occasionToFormality(occasion) {
  switch (occasion) {
    case 'formal': return 'formal';
    case 'work': return 'smart-casual';
    case 'date': return 'smart-casual';
    default: return 'casual';
  }
}

function formalityCloseness(itemFormality, target) {
  const fa = FORMALITY_RANK[itemFormality] ?? 0;
  const fb = FORMALITY_RANK[target] ?? 0;
  return 1 - Math.min(Math.abs(fa - fb), 2) / 2;
}

function passesWeatherFilter(item, weather) {
  const tags = (item.tags || []).map((t) => t.toLowerCase());
  if (weather === 'hot' && (OUTER_LAYER.includes(item.category) || tags.includes('wool') || tags.includes('heavy'))) return false;
  if (weather === 'cold' && item.category === 'skirts' && !tags.includes('winter')) return false;
  return true;
}
