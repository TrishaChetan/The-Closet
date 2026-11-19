// weekplan.js — plan an outfit for each day of the week.
// Rules: every outfit is colour-coordinated, no piece is worn two days in a
// row, pieces are spread across the week, and things you haven't worn in a
// while get a nudge. Pure functions (no DOM), so they're easy to test.

import { scorePair, TOP_LIKE, BOTTOM_LIKE, DRESS_LIKE } from './matcher.js';
import { getProfile } from './styleProfiles.js';

const GOOD_PAIR = 0.6;
const STORAGE_KEY = 'closet_week_plan';
const DAY_MS = 86400000;

function daysAgo(iso, today) {
  if (!iso) return Infinity;
  return Math.floor((today - new Date(iso + 'T00:00:00')) / DAY_MS);
}

export function isoDate(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

/** Every coordinated outfit the closet can make: [{ ids: [...], score }] */
export function allOutfits(items, profileId = null) {
  const profile = getProfile(profileId);
  const tops = items.filter((i) => TOP_LIKE.includes(i.category));
  const bottoms = items.filter((i) => BOTTOM_LIKE.includes(i.category));
  const out = [];
  for (const t of tops) for (const b of bottoms) {
    const s = scorePair(t, b, profile);
    if (s >= GOOD_PAIR) out.push({ ids: [t.id, b.id], score: s });
  }
  if (!out.length) {  // nothing clears the bar: take the best pairs anyway
    for (const t of tops) for (const b of bottoms) out.push({ ids: [t.id, b.id], score: scorePair(t, b, profile) });
  }
  for (const d of items.filter((i) => DRESS_LIKE.includes(i.category))) out.push({ ids: [d.id], score: 0.85 });
  return out;
}

function pick(outfits, itemsById, { exclude = new Set(), usedCount = new Map(), today, avoid = null }) {
  let best = null;
  for (const o of outfits) {
    if (o.ids.some((id) => exclude.has(id))) continue;
    if (avoid && o.ids.join() === avoid) continue;
    let s = o.score;
    // spread pieces over the week (averaged, so a dress isn't favoured over two-piece outfits)
    s -= 0.4 * o.ids.reduce((n, id) => n + (usedCount.get(id) || 0), 0) / o.ids.length;
    for (const id of o.ids) {
      const ago = daysAgo(itemsById.get(id)?.lastWorn, today);
      if (ago <= 1) s -= 0.3;                                  // worn yesterday/today
      else if (ago >= 30) s += 0.15;                           // forgotten: give it an outing
    }
    s += Math.random() * 0.05;                                 // a little variety between plans
    if (!best || s > best.s) best = { o, s };
  }
  return best && best.o;
}

/**
 * @returns {{ start: string, days: [{ date, ids, worn }] }} or { days: [] , note } if nothing fits
 */
export function planWeek(items, { start = new Date(), days = 7, profileId = null } = {}) {
  const outfits = allOutfits(items, profileId);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  if (!outfits.length) {
    return { start: isoDate(startDay), days: [], note: 'Add at least one top and one bottom (or a dress) to plan a week.' };
  }
  const byId = new Map(items.map((i) => [i.id, i]));
  const usedCount = new Map();
  const plan = [];
  let prev = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(startDay.getTime() + d * DAY_MS);
    // never yesterday's pieces; fall back to "anything" for tiny closets
    const o = pick(outfits, byId, { exclude: new Set(prev), usedCount, today: date })
      || pick(outfits, byId, { usedCount, today: date });
    o.ids.forEach((id) => usedCount.set(id, (usedCount.get(id) || 0) + 1));
    plan.push({ date: isoDate(date), ids: [...o.ids], worn: false });
    prev = o.ids;
  }
  return { start: isoDate(startDay), days: plan };
}

/** Replace one day's outfit, keeping the no-repeat rule with its neighbours. */
export function swapDay(plan, index, items, { profileId = null } = {}) {
  const outfits = allOutfits(items, profileId);
  const byId = new Map(items.map((i) => [i.id, i]));
  const neighbours = new Set([...(plan.days[index - 1]?.ids || []), ...(plan.days[index + 1]?.ids || [])]);
  const usedCount = new Map();
  plan.days.forEach((d, i) => { if (i !== index) d.ids.forEach((id) => usedCount.set(id, (usedCount.get(id) || 0) + 1)); });
  const today = new Date(plan.days[index].date + 'T00:00:00');
  const current = plan.days[index].ids.join();
  const o = pick(outfits, byId, { exclude: neighbours, usedCount, today, avoid: current })
    || pick(outfits, byId, { usedCount, today, avoid: current });
  if (!o) return false;  // only one possible outfit
  plan.days[index] = { ...plan.days[index], ids: [...o.ids], worn: false };
  return true;
}

/** Drop pieces that were deleted since the plan was made; days left empty are removed from view. */
export function cleanPlan(plan, items) {
  if (!plan || !Array.isArray(plan.days)) return null;
  const ids = new Set(items.map((i) => i.id));
  plan.days = plan.days.map((d) => ({ ...d, ids: (d.ids || []).filter((id) => ids.has(id)) }));
  return plan;
}

export function loadPlan(storage = globalThis.localStorage) {
  try { return JSON.parse(storage.getItem(STORAGE_KEY)); } catch (e) { return null; }
}

export function savePlan(plan, storage = globalThis.localStorage) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(plan)); } catch (e) { /* private mode: plan just isn't kept */ }
}
