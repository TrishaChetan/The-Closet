// app.js — main entry point. Wires DOM events to db.js / matcher.js / ui.js / mannequin.js.

import { ClosetDB, makeId } from './db.js';
import { detectDominantColor } from './colorDetect.js';
import { removeBackground } from './bgRemoval.js';
import { STYLE_PROFILES } from './styleProfiles.js';
import { matchAroundItem, composeFullOutfit, randomOutfit } from './matcher.js';
import { getFreeformOutfitIdea, summarizeClosetForPrompt } from './ai.js';
import { buildMannequinSVG } from './mannequin.js';
import * as UI from './ui.js';

const state = {
  items: [],
  closetFilter: 'all',
  flipFilter: null,
  flipIndex: 0,
  matchMode: 'around-item',
  pendingPhoto: null, // { dataUrl, color }
  mannequin: {
    gender: 'unisex', heightCm: 165, bustCm: 90, waistCm: 75, hipCm: 95, thighCm: 52, buttCm: 95,
    skinTone: '#C68863', eyeColor: '#5B4636', hairStyle: 'wavy-shoulder', hairColor: '#2B1B12'
  }
};

// ---------------- Navigation ----------------
function showView(viewName) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('is-active'));
  document.getElementById(`view-${viewName}`)?.classList.add('is-active');
  document.querySelectorAll('.ribbon-tab').forEach((t) => {
    t.classList.toggle('is-active', t.dataset.view === viewName);
  });
  if (viewName === 'match') refreshMatchSelectors();
  if (viewName === 'mannequin') renderMannequin();
  if (viewName === 'flip' && !state.flipFilter) {
    const firstWithItems = UI.CATEGORIES.find((c) => state.items.some((i) => i.category === c.id));
    if (firstWithItems) selectFlipCategory(firstWithItems.id);
  }
}

document.querySelectorAll('.ribbon-tab').forEach((tab) => {
  tab.addEventListener('click', () => showView(tab.dataset.view));
});

// ---------------- Data load ----------------
async function loadItems() {
  state.items = await ClosetDB.getAllItems();
  renderClosetView();
}

async function deleteItemEverywhere(id) {
  await ClosetDB.deleteItem(id);
  state.items = state.items.filter((i) => i.id !== id);
  renderClosetView();
  renderFlipCard();
}

// ---------------- Closet grid view ----------------
function renderClosetView() {
  const rail = document.getElementById('category-rail');
  UI.renderCategoryRail(rail, state.closetFilter, (catId) => {
    state.closetFilter = catId;
    renderClosetView();
  });
  const filtered = state.closetFilter === 'all'
    ? state.items
    : state.items.filter((i) => i.category === state.closetFilter);
  UI.renderClosetGrid(document.getElementById('closet-grid'), filtered, document.getElementById('closet-count'), deleteItemEverywhere);
}

// ---------------- Flip-through view ----------------
function renderFlipRail() {
  const rail = document.getElementById('flip-category-rail');
  UI.renderCategoryRail(rail, state.flipFilter || 'all', (catId) => selectFlipCategory(catId));
}

function selectFlipCategory(catId) {
  state.flipFilter = catId;
  state.flipIndex = 0;
  renderFlipRail();
  renderFlipCard();
}

function currentFlipItems() {
  if (!state.flipFilter || state.flipFilter === 'all') return state.items;
  return state.items.filter((i) => i.category === state.flipFilter);
}

function renderFlipCard() {
  const items = currentFlipItems();
  if (state.flipIndex >= items.length) state.flipIndex = Math.max(0, items.length - 1);
  const item = items[state.flipIndex];
  UI.renderFlipCard(document.getElementById('flip-card'), document.getElementById('flip-position'), item, state.flipIndex, items.length, deleteItemEverywhere);
}

document.getElementById('flip-prev').addEventListener('click', () => {
  const items = currentFlipItems();
  if (items.length === 0) return;
  state.flipIndex = (state.flipIndex - 1 + items.length) % items.length;
  renderFlipCard();
});
document.getElementById('flip-next').addEventListener('click', () => {
  const items = currentFlipItems();
  if (items.length === 0) return;
  state.flipIndex = (state.flipIndex + 1) % items.length;
  renderFlipCard();
});
renderFlipRail();

// ---------------- Match Me view ----------------
document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.matchMode = btn.dataset.mode;
    document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
    document.getElementById('panel-around-item').classList.toggle('is-active', state.matchMode === 'around-item');
    document.getElementById('panel-full-outfit').classList.toggle('is-active', state.matchMode === 'full-outfit');
    document.getElementById('panel-surprise').classList.toggle('is-active', state.matchMode === 'surprise');
  });
});

function refreshMatchSelectors() {
  const anchorSelect = document.getElementById('anchor-select');
  anchorSelect.innerHTML = '<option value="">Choose a piece from your closet…</option>' +
    state.items.map((i) => `<option value="${i.id}">${UI.escapeHtml(i.name)} (${UI.categoryLabel(i.category)})</option>`).join('');

  for (const selectId of ['profile-select-anchor', 'profile-select-full']) {
    const sel = document.getElementById(selectId);
    sel.innerHTML = STYLE_PROFILES.map((p) => `<option value="${p.id}">${UI.escapeHtml(p.label)}</option>`).join('');
  }

  const surpriseSel = document.getElementById('profile-select-surprise');
  surpriseSel.innerHTML = '<option value="">No particular theme — just surprise me</option>' +
    STYLE_PROFILES.map((p) => `<option value="${p.id}">${UI.escapeHtml(p.label)}</option>`).join('');
}

function goPreviewOnMannequin(result, kind) {
  const map = UI.outfitResultToCategoryMap(result, kind);
  state.mannequinOutfit = map;
  showView('mannequin');
}

document.getElementById('btn-match-anchor').addEventListener('click', () => {
  const id = document.getElementById('anchor-select').value;
  const anchor = state.items.find((i) => i.id === id);
  const resultsEl = document.getElementById('anchor-results');
  if (!anchor) {
    resultsEl.innerHTML = '<p class="results-empty">Choose an item first.</p>';
    return;
  }
  const profileId = document.getElementById('profile-select-anchor').value;
  const result = matchAroundItem(anchor, state.items, profileId);
  UI.renderOutfitResult(resultsEl, result, 'anchor', goPreviewOnMannequin);
});

document.getElementById('btn-match-full').addEventListener('click', () => {
  const occasion = document.getElementById('occasion-select').value;
  const weather = document.getElementById('weather-select').value;
  const profileId = document.getElementById('profile-select-full').value;
  const resultsEl = document.getElementById('full-outfit-results');
  const result = composeFullOutfit(state.items, { occasion, weather, profileId });
  UI.renderOutfitResult(resultsEl, result, 'full', goPreviewOnMannequin);
});

document.getElementById('btn-match-surprise').addEventListener('click', () => {
  const profileId = document.getElementById('profile-select-surprise').value;
  const resultsEl = document.getElementById('surprise-results');
  const result = randomOutfit(state.items, { profileId: profileId || null });
  UI.renderOutfitResult(resultsEl, result, 'surprise', goPreviewOnMannequin);
});

// ---------------- Add item view ----------------
const photoDrop = document.getElementById('photo-drop');
const btnTakePhoto = document.getElementById('btn-take-photo');
const btnChoosePhoto = document.getElementById('btn-choose-photo');
const photoInputCamera = document.getElementById('photo-input-camera');
const photoInputLibrary = document.getElementById('photo-input-library');
const photoPreview = document.getElementById('photo-preview');
const photoDropEmpty = document.getElementById('photo-drop-empty');
const colorSwatch = document.getElementById('color-chip-swatch');
const colorLabel = document.getElementById('color-chip-label');

const cutoutRow = document.getElementById('cutout-row');
const btnRemoveBg = document.getElementById('btn-remove-bg');
const btnUndoBg = document.getElementById('btn-undo-bg');

btnTakePhoto.addEventListener('click', () => photoInputCamera.click());
btnChoosePhoto.addEventListener('click', () => photoInputLibrary.click());
photoInputCamera.addEventListener('change', () => handlePhotoFile(photoInputCamera.files[0]));
photoInputLibrary.addEventListener('change', () => handlePhotoFile(photoInputLibrary.files[0]));

async function handlePhotoFile(file) {
  if (!file) return;
  const dataUrl = await fileToDataUrl(file);
  photoPreview.src = dataUrl;
  photoPreview.hidden = false;
  photoDropEmpty.hidden = true;
  cutoutRow.hidden = false;
  btnUndoBg.hidden = true;

  const img = new Image();
  img.onload = () => {
    const color = detectDominantColor(img);
    state.pendingPhoto = { dataUrl, originalDataUrl: dataUrl, color };
    colorSwatch.style.background = color.hex;
    colorLabel.textContent = color.name;
  };
  img.src = dataUrl;
}

btnRemoveBg.addEventListener('click', () => {
  if (!state.pendingPhoto) return;
  const img = new Image();
  img.onload = () => {
    const cutoutUrl = removeBackground(img, 32);
    if (!cutoutUrl) {
      alert('Could not process that image for cutout — try the phone\u2019s built-in tool instead.');
      return;
    }
    state.pendingPhoto.dataUrl = cutoutUrl;
    photoPreview.src = cutoutUrl;
    btnUndoBg.hidden = false;
  };
  img.src = state.pendingPhoto.originalDataUrl;
});

btnUndoBg.addEventListener('click', () => {
  if (!state.pendingPhoto) return;
  state.pendingPhoto.dataUrl = state.pendingPhoto.originalDataUrl;
  photoPreview.src = state.pendingPhoto.originalDataUrl;
  btnUndoBg.hidden = true;
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById('add-item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('item-name').value.trim();
  const category = document.getElementById('item-category').value;
  const formality = document.getElementById('item-formality').value;
  const tags = document.getElementById('item-tags').value.split(',').map((t) => t.trim()).filter(Boolean);

  if (!name || !category) return;

  const item = {
    id: makeId(),
    name,
    category,
    formality,
    tags,
    photo: state.pendingPhoto?.dataUrl || null,
    color: state.pendingPhoto?.color || null,
    createdAt: Date.now()
  };

  await ClosetDB.addItem(item);
  state.items.push(item);

  e.target.reset();
  photoInputCamera.value = '';
  photoInputLibrary.value = '';
  photoPreview.hidden = true;
  photoDropEmpty.hidden = false;
  cutoutRow.hidden = true;
  btnUndoBg.hidden = true;
  colorSwatch.style.background = '#EFE8D8';
  colorLabel.textContent = 'Add a photo to detect colour';
  state.pendingPhoto = null;

  renderClosetView();
  showView('closet');
});

// ---------------- Mannequin view ----------------
function renderMannequin() {
  const svg = buildMannequinSVG(state.mannequin, state.mannequinOutfit || {});
  document.getElementById('mannequin-svg-holder').innerHTML = svg;
  const label = document.getElementById('mannequin-outfit-label');
  const outfitEntries = Object.values(state.mannequinOutfit || {});
  label.textContent = outfitEntries.length
    ? `Wearing: ${outfitEntries.map((i) => i.name).join(', ')}`
    : 'No outfit selected — generate one in Match Me, then choose "Preview on mannequin."';
}

function wireMannequinControls() {
  const ids = {
    gender: 'mq-gender', heightCm: 'mq-height', bustCm: 'mq-bust', waistCm: 'mq-waist',
    hipCm: 'mq-hip', thighCm: 'mq-thigh', buttCm: 'mq-butt',
    skinTone: 'mq-skin', eyeColor: 'mq-eye-color', hairStyle: 'mq-hairstyle', hairColor: 'mq-hair-color'
  };
  for (const [key, id] of Object.entries(ids)) {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      const raw = el.value;
      state.mannequin[key] = (el.type === 'number') ? Number(raw) : raw;
      renderMannequin();
    });
  }
}
wireMannequinControls();

document.getElementById('btn-save-mannequin').addEventListener('click', async () => {
  await ClosetDB.setSetting('mannequinParams', state.mannequin);
  const status = document.getElementById('mannequin-status');
  status.textContent = 'Saved — this mannequin will be remembered on this device.';
  setTimeout(() => (status.textContent = ''), 3000);
});

async function loadMannequinParams() {
  const saved = await ClosetDB.getSetting('mannequinParams');
  if (saved) {
    state.mannequin = { ...state.mannequin, ...saved };
  }
  document.getElementById('mq-gender').value = state.mannequin.gender;
  document.getElementById('mq-height').value = state.mannequin.heightCm;
  document.getElementById('mq-bust').value = state.mannequin.bustCm;
  document.getElementById('mq-waist').value = state.mannequin.waistCm;
  document.getElementById('mq-hip').value = state.mannequin.hipCm;
  document.getElementById('mq-thigh').value = state.mannequin.thighCm;
  document.getElementById('mq-butt').value = state.mannequin.buttCm;
  document.getElementById('mq-skin').value = state.mannequin.skinTone;
  document.getElementById('mq-eye-color').value = state.mannequin.eyeColor;
  document.getElementById('mq-hairstyle').value = state.mannequin.hairStyle;
  document.getElementById('mq-hair-color').value = state.mannequin.hairColor;
}

// ---------------- Settings view ----------------
async function loadSettings() {
  const apiKey = await ClosetDB.getSetting('anthropicApiKey');
  const aiEnabled = await ClosetDB.getSetting('aiEnabled');
  if (apiKey) document.getElementById('api-key-input').value = apiKey;
  document.getElementById('ai-toggle').checked = !!aiEnabled;
}

document.getElementById('btn-save-settings').addEventListener('click', async () => {
  const key = document.getElementById('api-key-input').value.trim();
  const enabled = document.getElementById('ai-toggle').checked;
  await ClosetDB.setSetting('anthropicApiKey', key);
  await ClosetDB.setSetting('aiEnabled', enabled);
  const status = document.getElementById('settings-status');
  status.textContent = 'Saved. This stays only in your browser.';
  setTimeout(() => (status.textContent = ''), 3000);
  maybeOfferAiStylist();
});

document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.items, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `closet-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('import-input').addEventListener('change', async () => {
  const file = document.getElementById('import-input').files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const imported = JSON.parse(text);
    if (!Array.isArray(imported)) throw new Error('Not a valid closet export.');
    for (const item of imported) {
      if (!item.id) item.id = makeId();
      await ClosetDB.addItem(item).catch(() => ClosetDB.updateItem(item));
    }
    await loadItems();
    document.getElementById('settings-status').textContent = `Imported ${imported.length} item(s).`;
  } catch (err) {
    document.getElementById('settings-status').textContent = 'That file could not be imported — check it\u2019s a Closet export.';
  }
});

document.getElementById('btn-clear-all').addEventListener('click', async () => {
  if (!confirm('This permanently deletes every item in your closet on this device. Continue?')) return;
  await ClosetDB.clearAll();
  await loadItems();
});

// ---------------- AI Stylist wiring (optional) ----------------
async function maybeOfferAiStylist() {
  const enabled = await ClosetDB.getSetting('aiEnabled');
  const apiKey = await ClosetDB.getSetting('anthropicApiKey');
  const existing = document.getElementById('ai-stylist-box');
  if (!enabled || !apiKey) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const panel = document.getElementById('panel-full-outfit');
  const box = document.createElement('div');
  box.id = 'ai-stylist-box';
  box.className = 'settings-card';
  box.style.marginTop = '1.25rem';
  box.innerHTML = `
    <h3>Ask the AI Stylist</h3>
    <p>Describe what you need in your own words — it will only suggest items already in your closet.</p>
    <input type="text" id="ai-request-input" class="text-input" placeholder="e.g. something for a rainy first date">
    <button class="btn-secondary" id="ai-request-btn">Ask</button>
    <div id="ai-request-result" class="results-area"></div>
  `;
  panel.appendChild(box);

  document.getElementById('ai-request-btn').addEventListener('click', async () => {
    const resultEl = document.getElementById('ai-request-result');
    const request = document.getElementById('ai-request-input').value.trim();
    if (!request) return;
    resultEl.innerHTML = '<p class="results-empty">Thinking…</p>';
    try {
      const key = await ClosetDB.getSetting('anthropicApiKey');
      const idea = await getFreeformOutfitIdea({
        apiKey: key,
        closetSummary: summarizeClosetForPrompt(state.items),
        request
      });
      resultEl.innerHTML = `<div class="outfit-result">${UI.escapeHtml(idea)}</div>`;
    } catch (err) {
      resultEl.innerHTML = `<p class="results-empty">${UI.escapeHtml(err.message)}</p>`;
    }
  });
}

// ---------------- Service worker (PWA) ----------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

// ---------------- Init ----------------
(async function init() {
  await loadItems();
  await loadSettings();
  await loadMannequinParams();
  refreshMatchSelectors();
  renderMannequin();
  maybeOfferAiStylist();
})();
