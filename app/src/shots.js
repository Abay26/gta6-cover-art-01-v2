// Fixed scenes for screenshots: ?shot=editor shows the editor with sample photos
// loaded; ?shot=cover shows the exported cover alone, edge to edge, at full export
// size. Query params pick the scene: layout, size, grade, title, subtitle, badge,
// titleStyle, captions (on/off), roles (comma-separated captions, dealt across
// the cells), photos (comma-separated sample names, dealt across the panels).
// window.__shotReady is set once the scene is painted.
import { SIZES } from './grades.js';
import { LAYOUTS } from './cells.js';

/** The bundled sample photos, in tray order. */
export const SAMPLE_PHOTOS = ['convertible', 'rooftop', 'boulevard', 'pier'];

/** Loads the named samples (or all of them) and deals them across the cells. */
async function dealPhotos(api, names) {
  const list = names.length ? names : SAMPLE_PHOTOS;
  for (const name of list) {
    if (!api.state.photos.some((img) => img.src.includes(`/${name}.jpg`))) {
      try {
        await api.addPhoto(`samples/${name}.jpg`, name);
      } catch {
        // A missing sample just leaves its cells empty.
      }
    }
  }
  const n = LAYOUTS[api.state.layout].cells.length;
  for (let i = 0; i < n; i++) {
    api.state.cells[i].photo = api.state.photos.length ? i % api.state.photos.length : null;
    api.state.cells[i].zoom = 1;
    api.state.cells[i].ox = 0;
    api.state.cells[i].oy = 0;
  }
}

/** Default role captions, dealt across the cells of a layout. */
const SCENE_CAPTIONS = [
  'THE DRIVER', 'THE HACKER', 'THE GETAWAY', 'THE LOOKOUT', 'THE MUSCLE',
  'THE FIXER', 'THE INSIDE', 'THE WHEELMAN', 'THE CLEANER',
];

/** Fresh cells for a layout, matching its cell count. */
function sceneCells(layout) {
  const n = LAYOUTS[layout].cells.length;
  return Array.from({ length: n }, (_, i) => ({
    photo: null,
    zoom: 1,
    ox: 0,
    oy: 0,
    caption: SCENE_CAPTIONS[i % SCENE_CAPTIONS.length],
  }));
}

/** Applies the scene's query params to the editor state. */
function applySceneParams(api, query) {
  const s = api.state;
  const layout = query.get('layout');
  if (layout && LAYOUTS[layout]) {
    s.layout = layout;
    s.cells = sceneCells(layout);
  }
  const size = query.get('size');
  if (size && SIZES[size]) s.size = size;
  const grade = query.get('grade');
  if (grade) s.grade = grade;
  const title = query.get('title');
  if (title != null) s.title = title;
  const subtitle = query.get('subtitle');
  if (subtitle != null) s.subtitle = subtitle;
  const badge = query.get('badge');
  if (badge != null) s.badge = badge;
  const titleStyle = query.get('titleStyle');
  if (titleStyle) s.titleStyle = titleStyle;
  const captions = query.get('captions');
  if (captions != null) s.showCaptions = captions !== 'off';
  const roles = (query.get('roles') || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  for (let i = 0; i < roles.length && i < s.cells.length; i++) {
    s.cells[i].caption = roles[i].toUpperCase();
  }
  s.selected = 0;
  s.showSelection = false;
}

export async function runShot(shot, query, api) {
  applySceneParams(api, query);
  const names = (query.get('photos') || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  await dealPhotos(api, names);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const { w, h } = SIZES[api.state.size];
    const canvas = document.getElementById('cover');
    canvas.width = w;
    canvas.height = h;
    api.redraw();
  } else if (shot === 'export') {
    // End-to-end export check: downloads the PNG and records its name.
    const name = await api.exportCover(api.state.size);
    window.__exported = name;
    api.syncInputs();
    api.rebuildTray();
    api.rebuildThumbs();
    api.redraw();
  } else {
    api.syncInputs();
    api.rebuildTray();
    api.rebuildThumbs();
    api.redraw();
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      window.__shotReady = true;
    }),
  );
}
