// ui.js — pure(ish) rendering helpers. Takes data, returns/updates DOM.

export const CATEGORIES = [
  { id: 'tops', label: 'Tops / Shirts' },
  { id: 'dresses-short', label: 'Short Dresses' },
  { id: 'dresses-midi', label: 'Midi Dresses' },
  { id: 'dresses-long', label: 'Long Dresses' },
  { id: 'gowns', label: 'Gowns / Formal Dresses' },
  { id: 'jumpsuits', label: 'Jumpsuits / Rompers' },
  { id: 'blazers', label: 'Blazers' },
  { id: 'jackets', label: 'Jackets / Coats' },
  { id: 'hoodies', label: 'Hoodies / Sweaters' },
  { id: 'skirts', label: 'Skirts' },
  { id: 'jeans', label: 'Jeans' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'pants', label: 'Pants / Trousers' },
  { id: 'activewear', label: 'Activewear' },
  { id: 'footwear', label: 'Footwear' },
  { id: 'hats', label: 'Hats' },
  { id: 'purses', label: 'Purses / Bags' },
  { id: 'belts', label: 'Belts' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'watch', label: 'Watches' },
  { id: 'rings', label: 'Rings' },
  { id: 'necklace', label: 'Necklaces' },
  { id: 'earrings', label: 'Earrings' },
  { id: 'scarves', label: 'Scarves' }
];

export const FORGOTTEN_DAYS = 30;

export function renderCategoryRail(container, activeId, onSelect, { showForgotten = false } = {}) {
  container.innerHTML = '';
  const allChip = makeChip('all', 'All', activeId === 'all');
  allChip.addEventListener('click', () => onSelect('all'));
  container.appendChild(allChip);

  if (showForgotten) {
    const forgotChip = makeChip('forgotten', '💤 Forgotten', activeId === 'forgotten');
    forgotChip.title = `Items you haven't worn in ${FORGOTTEN_DAYS}+ days (or never)`;
    forgotChip.addEventListener('click', () => onSelect('forgotten'));
    container.appendChild(forgotChip);
  }

  for (const cat of CATEGORIES) {
    const chip = makeChip(cat.id, cat.label, activeId === cat.id);
    chip.addEventListener('click', () => onSelect(cat.id));
    container.appendChild(chip);
  }
}

function makeChip(id, label, isActive) {
  const btn = document.createElement('button');
  btn.className = 'category-chip' + (isActive ? ' is-active' : '');
  btn.textContent = label;
  btn.dataset.category = id;
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-selected', String(isActive));
  return btn;
}

// ---- wear tracking helpers ----
export function daysSince(isoDate) {
  if (!isoDate) return Infinity;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

export function isForgotten(item) {
  return daysSince(item.lastWorn) >= FORGOTTEN_DAYS;
}

export function wearSummary(item) {
  const count = item.wearCount || 0;
  if (!count) return 'Never worn';
  const d = daysSince(item.lastWorn);
  const when = d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
  return `Worn ${count}× · last ${when}`;
}

export function categoryLabel(id) {
  const found = CATEGORIES.find((c) => c.id === id);
  return found ? found.label : id;
}

export function renderClosetGrid(container, items, countEl, onDelete) {
  container.innerHTML = '';
  countEl.textContent = items.length
    ? `${items.length} item${items.length === 1 ? '' : 's'} catalogued.`
    : 'Nothing here yet — add an item to get started.';

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'closet-empty-state';
    empty.innerHTML = `<p>Your closet is empty in this category.<br>Head to <strong>Add Item</strong> to catalogue something.</p>`;
    container.appendChild(empty);
    return;
  }

  for (const item of items) {
    container.appendChild(makeClosetCard(item, onDelete));
  }
}

function makeClosetCard(item, onDelete) {
  const card = document.createElement('div');
  card.className = 'closet-card';
  const photo = document.createElement('div');
  photo.className = 'closet-card-photo';
  if (item.photo) {
    photo.style.backgroundImage = `url(${item.photo})`;
  } else {
    photo.textContent = 'No photo';
  }
  const delBtn = document.createElement('button');
  delBtn.className = 'closet-card-delete';
  delBtn.setAttribute('aria-label', `Delete ${item.name}`);
  delBtn.title = 'Delete this item';
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`Delete "${item.name}" from your closet?`)) onDelete?.(item.id);
  });
  photo.appendChild(delBtn);

  const body = document.createElement('div');
  body.className = 'closet-card-body';
  body.innerHTML = `
    <div class="closet-card-name">${escapeHtml(item.name)}</div>
    <div class="closet-card-meta">
      <span class="closet-card-swatch" style="background:${item.color?.hex || '#EFE8D8'}"></span>
      <span>${escapeHtml(item.color?.name || 'Unknown')} · ${categoryLabel(item.category)}</span>
    </div>
    <div class="closet-card-wear${isForgotten(item) ? ' is-forgotten' : ''}">${wearSummary(item)}</div>
  `;
  card.appendChild(photo);
  card.appendChild(body);
  return card;
}

export function renderFlipCard(container, positionEl, item, index, total, onDelete) {
  container.innerHTML = '';
  if (!item) {
    container.innerHTML = '<p class="index-card-empty">No items in this category yet.</p>';
    positionEl.textContent = '';
    return;
  }
  const photo = document.createElement('div');
  photo.className = 'index-card-photo';
  if (item.photo) photo.style.backgroundImage = `url(${item.photo})`;

  const delBtn = document.createElement('button');
  delBtn.className = 'closet-card-delete';
  delBtn.setAttribute('aria-label', `Delete ${item.name}`);
  delBtn.title = 'Delete this item';
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', () => {
    if (confirm(`Delete "${item.name}" from your closet?`)) onDelete?.(item.id);
  });
  photo.appendChild(delBtn);

  const info = document.createElement('div');
  info.className = 'index-card-info';
  info.innerHTML = `
    <h4>${escapeHtml(item.name)}</h4>
    <p style="margin:0;color:var(--ink-soft);font-size:0.85rem;">${escapeHtml(item.color?.name || 'Unknown colour')}</p>
    <span class="index-card-tag">${categoryLabel(item.category)}</span>
    <p class="closet-card-wear${isForgotten(item) ? ' is-forgotten' : ''}">${wearSummary(item)}</p>
    ${item.tags && item.tags.length ? `<div style="margin-top:0.5rem;">${item.tags.map(t => `<span class="index-card-tag" style="margin-right:0.3rem;">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
  `;
  container.appendChild(photo);
  container.appendChild(info);
  positionEl.textContent = `${index + 1} of ${total}`;
}

export function renderOutfitResult(container, result, kind, onPreviewMannequin, onWear) {
  container.innerHTML = '';
  if (!result || (!result.picks || result.picks.length === 0)) {
    const p = document.createElement('p');
    p.className = 'results-empty';
    p.textContent = (result && result.note) || 'Not enough items yet to build a suggestion. Try adding more to your closet.';
    container.appendChild(p);
    return;
  }

  const card = document.createElement('div');
  card.className = 'outfit-result';
  const title = document.createElement('h4');
  title.textContent = kind === 'anchor' ? `Built around ${result.anchor.name}` : (kind === 'surprise' ? 'Your surprise outfit' : 'Suggested outfit');
  card.appendChild(title);

  const itemsRow = document.createElement('div');
  itemsRow.className = 'outfit-result-items';

  if (kind === 'anchor') {
    itemsRow.appendChild(makeOutfitPiece(result.anchor, true));
  }
  for (const pick of result.picks) {
    itemsRow.appendChild(makeOutfitPiece(pick.item, false));
  }
  card.appendChild(itemsRow);

  if (result.profile?.pairingNotes) {
    const why = document.createElement('p');
    why.className = 'outfit-why';
    why.textContent = `${result.profile.label}: ${result.profile.pairingNotes}`;
    card.appendChild(why);
  }

  if (onPreviewMannequin) {
    const btn = document.createElement('button');
    btn.className = 'btn-secondary';
    btn.style.marginTop = '0.75rem';
    btn.textContent = 'Preview on mannequin';
    btn.addEventListener('click', () => onPreviewMannequin(result, kind));
    card.appendChild(btn);
  }

  if (onWear) {
    const wearBtn = document.createElement('button');
    wearBtn.className = 'btn-secondary';
    wearBtn.style.marginTop = '0.75rem';
    wearBtn.style.marginLeft = '0.5rem';
    wearBtn.textContent = '👗 I wore this today';
    wearBtn.addEventListener('click', async () => {
      wearBtn.disabled = true;
      const pieces = Object.values(outfitResultToCategoryMap(result, kind));
      await onWear(pieces);
      wearBtn.textContent = `✓ Logged ${pieces.length} piece${pieces.length === 1 ? '' : 's'}`;
    });
    card.appendChild(wearBtn);
  }

  container.appendChild(card);
}

function makeOutfitPiece(item, isAnchor) {
  const el = document.createElement('div');
  el.className = 'outfit-piece';
  el.innerHTML = `
    ${item.photo ? `<img src="${item.photo}" alt="">` : ''}
    <span>${isAnchor ? '★ ' : ''}${escapeHtml(item.name)}</span>
  `;
  return el;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

export function outfitResultToCategoryMap(result, kind) {
  const map = {};
  if (!result) return map;
  if (kind === 'anchor' && result.anchor) map[result.anchor.category] = result.anchor;
  for (const pick of result.picks || []) {
    map[pick.item.category] = pick.item;
  }
  return map;
}


// ---- closet insights ----
export function computeInsights(items) {
  const total = items.length;
  const wears = items.reduce((s, i) => s + (i.wearCount || 0), 0);
  const never = items.filter((i) => !i.wearCount).length;
  const recent = items.filter((i) => daysSince(i.lastWorn) < 30).length;
  const mostWorn = items.filter((i) => i.wearCount)
    .sort((a, b) => b.wearCount - a.wearCount || daysSince(a.lastWorn) - daysSince(b.lastWorn))
    .slice(0, 3);

  const colors = new Map();
  for (const i of items) {
    const name = i.color?.name || 'Unknown';
    const entry = colors.get(name) || { name, hex: i.color?.hex || '#ccc', count: 0 };
    entry.count += 1;
    colors.set(name, entry);
  }
  const palette = [...colors.values()].sort((a, b) => b.count - a.count);

  // category with the largest share of forgotten pieces (needs 2+ items to count)
  let neglected = null;
  for (const cat of CATEGORIES) {
    const inCat = items.filter((i) => i.category === cat.id);
    if (inCat.length < 2) continue;
    const share = inCat.filter(isForgotten).length / inCat.length;
    if (share > 0 && (!neglected || share > neglected.share)) {
      neglected = { label: cat.label, share, count: inCat.length };
    }
  }
  return { total, wears, never, recent, mostWorn, palette, neglected };
}

export function renderInsights(details, body, items) {
  details.hidden = items.length === 0;
  if (!items.length) return;
  const s = computeInsights(items);
  const pct = (n) => Math.round((n / s.total) * 100);
  const top = s.palette.slice(0, 6);
  const other = s.palette.slice(6).reduce((n, c) => n + c.count, 0);

  body.innerHTML = `
    <div class="insight-tiles">
      <div class="insight-tile"><span class="insight-num">${s.total}</span><span>pieces</span></div>
      <div class="insight-tile"><span class="insight-num">${s.wears}</span><span>wears logged</span></div>
      <div class="insight-tile"><span class="insight-num">${pct(s.recent)}%</span><span>worn in the last 30 days</span></div>
      <div class="insight-tile${s.never ? ' is-warn' : ''}"><span class="insight-num">${pct(s.never)}%</span><span>never worn</span></div>
    </div>
    <div class="insight-section">
      <h4>Colour palette</h4>
      <div class="palette-bar" role="img" aria-label="Colour distribution of your closet">
        ${top.map((c) => `<span style="flex:${c.count};background:${escapeHtml(c.hex)}" title="${escapeHtml(c.name)}: ${c.count}"></span>`).join('')}
        ${other ? `<span style="flex:${other};background:#bbb" title="Other: ${other}"></span>` : ''}
      </div>
      <ul class="palette-legend">
        ${top.map((c) => `<li><i style="background:${escapeHtml(c.hex)}"></i>${escapeHtml(c.name)} <b>${c.count}</b></li>`).join('')}
        ${other ? `<li><i style="background:#bbb"></i>Other <b>${other}</b></li>` : ''}
      </ul>
    </div>
    <div class="insight-section">
      <h4>Most worn</h4>
      ${s.mostWorn.length
        ? `<ol class="insight-list">${s.mostWorn.map((i) => `<li>${escapeHtml(i.name || 'Untitled')} <span>${i.wearCount}×</span></li>`).join('')}</ol>`
        : '<p class="insight-empty">Nothing logged yet — tap “I wore this today” on an outfit in Match Me.</p>'}
    </div>
    ${s.neglected ? `<p class="insight-tip">💤 <b>${escapeHtml(s.neglected.label)}</b> is your most neglected category —
      ${Math.round(s.neglected.share * 100)}% of its ${s.neglected.count} pieces haven't been worn in ${FORGOTTEN_DAYS}+ days.</p>` : ''}
  `;
}
