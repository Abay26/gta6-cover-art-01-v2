// Vice Press editor: the live preview, the photo tray, the layout thumbnails,
// the grade swatches, the caption controls and the PNG export. The state is one
// plain object; every change pushes a snapshot onto the undo stack first.
import { renderCover } from './cover.js';
import { LAYOUTS, cellAtPoint, cellCount } from './cells.js';
import { GRADES, SIZES, TITLE_STYLES } from './grades.js';
import { runShot, SAMPLE_PHOTOS } from './shots.js';

/** Default role captions, dealt across the cells of a layout. */
export const DEFAULT_CAPTIONS = [
  'THE DRIVER', 'THE HACKER', 'THE GETAWAY', 'THE LOOKOUT', 'THE MUSCLE',
  'THE FIXER', 'THE INSIDE', 'THE WHEELMAN', 'THE CLEANER',
];

/** A few headlines the dice can deal, so one tap gives a whole new look. */
const DICE_TITLES = [
  'VICE PRESS', 'NEON TIDE', 'BAYSIDE GOLD', 'MIDNIGHT VICE', 'PALM ROYALE',
  'SUNSET HEIST', 'CANDY FLATS', 'OCEAN DRIVE',
];

/** Fresh cells for a layout: no photo yet, caption dealt by index. */
function freshCells(layout) {
  const n = cellCount(layout);
  return Array.from({ length: n }, (_, i) => ({
    photo: null,
    zoom: 1,
    ox: 0,
    oy: 0,
    caption: DEFAULT_CAPTIONS[i % DEFAULT_CAPTIONS.length],
  }));
}

/** The editor's starting state. */
function freshState() {
  return {
    layout: 'crew',
    size: 'square',
    grade: 'sunset',
    titleStyle: 'gradient',
    title: 'VICE PRESS',
    subtitle: 'Five roles, one last job',
    badge: 'EST. 2026',
    showCaptions: true,
    photos: [],
    cells: freshCells('crew'),
    selected: 0,
    showSelection: true,
  };
}

/** A snapshot of everything undoable: the scalars and the cells, not the photos. */
function snapshotOf(state) {
  return JSON.stringify({
    layout: state.layout,
    size: state.size,
    grade: state.grade,
    titleStyle: state.titleStyle,
    title: state.title,
    subtitle: state.subtitle,
    badge: state.badge,
    showCaptions: state.showCaptions,
    cells: state.cells,
  });
}

function restoreSnapshot(state, snap) {
  const s = JSON.parse(snap);
  Object.assign(state, s);
}

const state = freshState();
const undoStack = [];
const redoStack = [];

function pushHistory() {
  undoStack.push(snapshotOf(state));
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshotOf(state));
  restoreSnapshot(state, undoStack.pop());
  syncInputs();
  rebuildThumbs();
  redraw();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshotOf(state));
  restoreSnapshot(state, redoStack.pop());
  syncInputs();
  rebuildThumbs();
  redraw();
}

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
let lastSize = '';

/** Paints the preview canvas from the state. */
function redraw() {
  const { w, h } = SIZES[state.size];
  if (lastSize !== state.size) {
    canvas.width = w;
    canvas.height = h;
    lastSize = state.size;
  }
  renderCover(ctx, state, w, h);
  document.getElementById('sizeLabel').textContent = `${SIZES[state.size].label} · ${state.cells.length} panels`;
}

/** Loads an image from a URL or data URI. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

/** Adds a loaded photo to the tray and returns its index. */
async function addPhoto(src, name) {
  const img = await loadImage(src);
  state.photos.push(img);
  return state.photos.length - 1;
}

/** Deals the tray photos across the cells, round-robin. */
function dealPhotosRoundRobin() {
  for (let i = 0; i < state.cells.length; i++) {
    state.cells[i].photo = state.photos.length ? i % state.photos.length : null;
    state.cells[i].zoom = 1;
    state.cells[i].ox = 0;
    state.cells[i].oy = 0;
  }
}

/** Shuffles which photo sits in each cell. */
function shufflePhotos() {
  if (!state.photos.length) return;
  pushHistory();
  const order = state.photos.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let i = 0; i < state.cells.length; i++) {
    state.cells[i].photo = order[i % order.length];
  }
  redraw();
}

/** Puts the same photo in every cell. */
function fillAllPhotos() {
  if (!state.photos.length) return;
  pushHistory();
  const first = state.cells[state.selected]?.photo ?? 0;
  for (const cell of state.cells) cell.photo = first;
  redraw();
}

/** Picks a whole new look: layout, grade, title style, headline and photo deal. */
function randomizeLook() {
  pushHistory();
  const layouts = Object.keys(LAYOUTS);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  const grades = Object.keys(GRADES);
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  const styles = Object.keys(TITLE_STYLES);
  state.titleStyle = styles[Math.floor(Math.random() * styles.length)];
  state.title = DICE_TITLES[Math.floor(Math.random() * DICE_TITLES.length)];
  setLayout(state.layout, true);
  shufflePhotos();
  syncInputs();
  rebuildThumbs();
  redraw();
}

/** Switches layout, keeping each cell's photo where it fits. */
function setLayout(layout, skipHistory) {
  if (!LAYOUTS[layout]) return;
  if (!skipHistory) pushHistory();
  const old = state.cells;
  state.layout = layout;
  state.cells = freshCells(layout);
  for (let i = 0; i < Math.min(old.length, state.cells.length); i++) {
    state.cells[i].photo = old[i].photo;
    state.cells[i].zoom = old[i].zoom;
    state.cells[i].ox = old[i].ox;
    state.cells[i].oy = old[i].oy;
  }
  state.selected = 0;
}

/** Renders one layout thumbnail from the live state. */
function paintThumb(key, thumbCanvas) {
  const t = thumbCanvas.getContext('2d');
  const mini = { ...state, layout: key, cells: freshCells(key), showSelection: false, selected: null };
  for (let i = 0; i < mini.cells.length; i++) {
    mini.cells[i].photo = state.photos.length ? i % state.photos.length : null;
  }
  thumbCanvas.width = 120;
  thumbCanvas.height = 90;
  renderCover(t, mini, 120, 90);
}

/** Rebuilds the layout thumbnail strip. */
function rebuildThumbs() {
  const strip = document.getElementById('layoutStrip');
  strip.innerHTML = '';
  for (const [key, layout] of Object.entries(LAYOUTS)) {
    const button = document.createElement('button');
    button.className = 'thumb' + (state.layout === key ? ' active' : '');
    button.type = 'button';
    button.title = layout.blurb;
    const c = document.createElement('canvas');
    paintThumb(key, c);
    const label = document.createElement('span');
    label.textContent = layout.label;
    button.append(c, label);
    button.addEventListener('click', () => {
      setLayout(key);
      syncInputs();
      rebuildThumbs();
      redraw();
    });
    strip.append(button);
  }
}

/** Rebuilds the photo tray from the state's photos. */
function rebuildTray() {
  const tray = document.getElementById('tray');
  tray.querySelectorAll('.tray-photo').forEach((el) => el.remove());
  state.photos.forEach((img, i) => {
    const button = document.createElement('button');
    button.className = 'tray-photo';
    button.type = 'button';
    button.title = `Place photo ${i + 1} in the selected panel`;
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = `Photo ${i + 1}`;
    button.append(thumb);
    button.addEventListener('click', () => {
      pushHistory();
      state.cells[state.selected].photo = i;
      state.cells[state.selected].zoom = 1;
      state.cells[state.selected].ox = 0;
      state.cells[state.selected].oy = 0;
      redraw();
    });
    tray.append(button);
  });
}

/** Copies the state into every control. */
function syncInputs() {
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('badgeInput').value = state.badge;
  document.getElementById('captionsToggle').checked = state.showCaptions;
  const cell = state.cells[state.selected] || {};
  document.getElementById('captionInput').value = cell.caption || '';
  document.getElementById('zoomInput').value = String(cell.zoom || 1);
  document.getElementById('zoomValue').textContent = `${Math.round((cell.zoom || 1) * 100)}%`;
  document.getElementById('panelLabel').textContent = `Panel ${state.selected + 1} of ${state.cells.length}`;
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('[data-style]').forEach((b) => {
    b.classList.toggle('active', b.dataset.style === state.titleStyle);
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
}

/** Renders the cover at export size and downloads it as a PNG. */
async function exportCover(sizeKey) {
  const { w, h } = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  renderCover(octx, { ...state, showSelection: false, selected: null }, w, h);
  const name = `vice-press-${sizeKey}.png`;
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return name;
}

/** Wires every control in the editor panel. */
function wireControls() {
  document.getElementById('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
  });
  document.getElementById('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  document.getElementById('badgeInput').addEventListener('input', (e) => {
    state.badge = e.target.value;
    redraw();
  });
  document.getElementById('captionsToggle').addEventListener('change', (e) => {
    pushHistory();
    state.showCaptions = e.target.checked;
    redraw();
  });
  document.getElementById('captionInput').addEventListener('input', (e) => {
    const cell = state.cells[state.selected];
    if (cell) cell.caption = e.target.value.toUpperCase();
    redraw();
  });
  document.getElementById('zoomInput').addEventListener('input', (e) => {
    const cell = state.cells[state.selected];
    if (cell) {
      cell.zoom = Number(e.target.value);
      document.getElementById('zoomValue').textContent = `${Math.round(cell.zoom * 100)}%`;
    }
    redraw();
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.addEventListener('click', () => {
      pushHistory();
      state.grade = b.dataset.grade;
      syncInputs();
      redraw();
    });
  });
  document.querySelectorAll('[data-style]').forEach((b) => {
    b.addEventListener('click', () => {
      pushHistory();
      state.titleStyle = b.dataset.style;
      syncInputs();
      redraw();
    });
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      pushHistory();
      state.size = b.dataset.size;
      syncInputs();
      redraw();
    });
  });
  document.getElementById('fillAllBtn').addEventListener('click', fillAllPhotos);
  document.getElementById('shuffleBtn').addEventListener('click', shufflePhotos);
  document.getElementById('diceBtn').addEventListener('click', randomizeLook);
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => exportCover(b.dataset.export));
  });
  document.getElementById('exportAllBtn').addEventListener('click', async () => {
    for (const key of Object.keys(SIZES)) await exportCover(key);
  });
  document.getElementById('uploadInput').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      const url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      await addPhoto(url, file.name);
    }
    dealPhotosRoundRobin();
    rebuildTray();
    redraw();
  });
  document.querySelectorAll('[data-sample]').forEach((b) => {
    b.addEventListener('click', async () => {
      await addPhoto(`samples/${b.dataset.sample}.jpg`, b.dataset.sample);
      dealPhotosRoundRobin();
      rebuildTray();
      redraw();
    });
  });

  // Drag inside a panel to pan its photo; click a panel to select it.
  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const hit = cellAtPoint(state.layout, canvas.width, canvas.height, px, py);
    if (hit < 0) return;
    state.selected = hit;
    syncInputs();
    redraw();
    dragging = { x: px, y: py, ox: state.cells[hit].ox || 0, oy: state.cells[hit].oy || 0, cell: state.cells[hit] };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
    dragging.cell.ox = dragging.ox + (px - dragging.x) / canvas.width;
    dragging.cell.oy = dragging.oy + (py - dragging.y) / canvas.height;
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    dragging = null;
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });
}

/** The API the screenshot scenes drive. */
const api = { state, loadImage, addPhoto, redraw, syncInputs, rebuildTray, rebuildThumbs, exportCover };

/** Boots the editor: controls, samples, then the scene or the live preview. */
async function boot() {
  wireControls();
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    state.showSelection = false;
    await runShot(shot, query, api);
    return;
  }
  for (const name of SAMPLE_PHOTOS) {
    try {
      await addPhoto(`samples/${name}.jpg`, name);
    } catch {
      // A missing sample just leaves its panels empty.
    }
  }
  dealPhotosRoundRobin();
  rebuildTray();
  rebuildThumbs();
  syncInputs();
  redraw();
}

boot();
