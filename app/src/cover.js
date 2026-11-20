// The cover renderer: paints a whole cover onto a canvas at the canvas's own
// pixel size, from the editor state — backdrop, photo cells, role captions, the
// title block, the grade wash, grain and vignette. Everything is drawn with the
// 2D canvas API; no image leaves the machine.
import { cellsForLayout, titleZoneFor } from './cells.js';
import { GRADES, TITLE_STYLES, washGradient } from './grades.js';
import { paintBackdrop, mulberry32 } from './decor.js';

const BACKDROP = '#160a24';
const CHROME_INK = ['#22e6d2', '#ff2975'];
const TITLE_RAINBOW = ['#ffd319', '#ff2975', '#8c1eff'];

/** Clamps v into [lo, hi]. */
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** A rounded-rectangle path, for chips and the badge ribbon. */
function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Shrinks `font(px)` until `text` fits `maxWidth`; returns the chosen px size. */
function fitTitleFont(ctx, text, startPx, maxWidth, fontFor) {
  let px = startPx;
  ctx.font = fontFor(px);
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = fontFor(px);
  }
  return px;
}

let grainTile = null;
/** A small tiled noise canvas, made once from a seeded generator, for film grain. */
function grainTexture(ctx) {
  if (grainTile) return grainTile;
  const rnd = mulberry32(20261121);
  const n = document.createElement('canvas');
  n.width = 128;
  n.height = 128;
  const c = n.getContext('2d');
  const data = c.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 100 + Math.floor(rnd() * 110);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  c.putImageData(data, 0, 0);
  grainTile = ctx.createPattern(n, 'repeat');
  return grainTile;
}

/** Draws one photo into a cell rect, cover-fit, with the cell's zoom and pan. */
export function paintPhotoCell(ctx, img, rect, cell, filter) {
  const { x: rx, y: ry, w: rw, h: rh } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  ctx.filter = filter;
  const base = Math.max(rw / img.naturalWidth, rh / img.naturalHeight) * (cell.zoom || 1);
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  let dx = rx + (rw - dw) / 2 + (cell.ox || 0) * rw;
  let dy = ry + (rh - dh) / 2 + (cell.oy || 0) * rh;
  if (dw > rw) dx = clamp(dx, rx + rw - dw, rx);
  if (dh > rh) dy = clamp(dy, ry + rh - dh, ry);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

/** Draws an empty cell: a dark gradient with a plus mark, inviting a photo. */
function paintEmptyCell(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, '#2b1745');
  g.addColorStop(1, '#170b26');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(245, 238, 252, 0.5)';
  ctx.font = `${Math.round(Math.min(rect.w, rect.h) * 0.3)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.textBaseline = 'alphabetic';
}

/** The box a role chip would occupy, so the renderer can test it against the title zone. */
export function roleChipBox(ctx, text, rect) {
  if (!text) return null;
  const pad = Math.max(6, rect.h * 0.03);
  const fs = Math.max(10, Math.round(Math.min(rect.w, rect.h) * 0.055));
  ctx.save();
  ctx.font = `${fs}px Anton, sans-serif`;
  const tw = ctx.measureText(text).width;
  ctx.restore();
  const bw = tw + pad * 2;
  const bh = fs + pad * 1.2;
  return {
    x: rect.x + Math.max(4, rect.w * 0.03),
    y: rect.y + rect.h - bh - Math.max(4, rect.h * 0.04),
    w: bw,
    h: bh,
  };
}

/** A role caption chip pinned to the bottom-left of a cell. */
export function paintRoleChip(ctx, text, rect) {
  const box = roleChipBox(ctx, text, rect);
  if (!box) return;
  const pad = Math.max(6, rect.h * 0.03);
  const fs = Math.max(10, Math.round(Math.min(rect.w, rect.h) * 0.055));
  ctx.save();
  ctx.fillStyle = 'rgba(12, 4, 28, 0.82)';
  roundRectPath(ctx, box.x, box.y, box.w, box.h, box.h / 2);
  ctx.fill();
  ctx.fillStyle = '#ffd319';
  ctx.font = `${fs}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, box.x + pad, box.y + box.h / 2 + 1);
  ctx.restore();
}

/** Paints the title, subtitle and badge ribbon inside a title zone. */
export function paintTitleBlock(ctx, state, zone, w) {
  const style = TITLE_STYLES[state.titleStyle] ? state.titleStyle : 'gradient';
  const { x, y, w: zw, h: zh, align } = zone;
  // A scrim so the lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, y, 0, y + zh);
  scrim.addColorStop(0, 'rgba(10, 4, 24, 0)');
  scrim.addColorStop(0.45, 'rgba(10, 4, 24, 0.42)');
  scrim.addColorStop(1, 'rgba(10, 4, 24, 0.62)');
  ctx.fillStyle = scrim;
  ctx.fillRect(x, y, zw, zh);

  const title = (state.title || '').toUpperCase();
  const titlePx = fitTitleFont(ctx, title, Math.round(zh * 0.5), zw, (px) => `${px}px Anton, sans-serif`);
  const subPx = Math.max(11, Math.round(zh * 0.16));
  const titleY = y + zh * 0.4;
  ctx.textAlign = align;
  const tx = align === 'center' ? x + zw / 2 : align === 'right' ? x + zw : x;
  ctx.textBaseline = 'middle';

  ctx.save();
  if (style === 'gradient') {
    const grad = ctx.createLinearGradient(tx, titleY - titlePx / 2, tx, titleY + titlePx / 2);
    grad.addColorStop(0, TITLE_RAINBOW[0]);
    grad.addColorStop(0.5, TITLE_RAINBOW[1]);
    grad.addColorStop(1, TITLE_RAINBOW[2]);
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(12, 4, 28, 0.9)';
    ctx.lineWidth = Math.max(2, titlePx / 14);
    ctx.strokeText(title, tx, titleY);
    ctx.fillText(title, tx, titleY);
  } else if (style === 'solid') {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(12, 4, 28, 0.9)';
    ctx.shadowBlur = Math.max(4, titlePx / 8);
    ctx.fillText(title, tx, titleY);
    ctx.shadowBlur = 0;
  } else if (style === 'outline') {
    ctx.strokeStyle = '#22e6d2';
    ctx.lineWidth = Math.max(2, titlePx / 12);
    ctx.shadowColor = '#ff2975';
    ctx.shadowBlur = Math.max(6, titlePx / 5);
    ctx.strokeText(title, tx, titleY);
    ctx.shadowBlur = 0;
  } else {
    // Chrome block: cyan and pink offsets under the white face.
    ctx.fillStyle = CHROME_INK[0];
    ctx.fillText(title, tx - titlePx * 0.045, titleY - titlePx * 0.045);
    ctx.fillStyle = CHROME_INK[1];
    ctx.fillText(title, tx + titlePx * 0.045, titleY + titlePx * 0.045);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(12, 4, 28, 0.9)';
    ctx.lineWidth = Math.max(2, titlePx / 16);
    ctx.strokeText(title, tx, titleY);
    ctx.fillText(title, tx, titleY);
  }
  ctx.restore();

  // Subtitle in neon script, then the badge ribbon.
  if (state.subtitle) {
    ctx.save();
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.fillStyle = '#ffd319';
    ctx.shadowColor = '#ff2975';
    ctx.shadowBlur = Math.max(4, subPx / 3);
    ctx.fillText(state.subtitle, tx, y + zh * 0.7);
    ctx.restore();
  }
  if (state.badge) {
    const bfs = Math.max(10, Math.round(zh * 0.11));
    ctx.save();
    ctx.font = `${bfs}px Anton, sans-serif`;
    const tw = ctx.measureText(state.badge).width;
    const pad = bfs * 0.7;
    const bw = tw + pad * 2;
    const bh = bfs + pad;
    const bx = align === 'center' ? x + zw / 2 - bw / 2 : align === 'right' ? x + zw - bw : x;
    const by = y + zh * 0.84;
    ctx.fillStyle = '#ff2975';
    roundRectPath(ctx, bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(state.badge, bx + bw / 2, by + bh / 2 + 1);
    ctx.restore();
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** Paints the whole cover for `state` onto `ctx` at w by h. */
export function renderCover(ctx, state, w, h) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.save();
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, w, h);
  paintBackdrop(ctx, grade, w, h);

  const rects = cellsForLayout(state.layout, w, h);
  const titleZone = titleZoneFor(state.layout, w, h);
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const cell = state.cells[i] || {};
    ctx.save();
    if (rect.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.tilt);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      // A white polaroid border around tilted snaps.
      ctx.fillStyle = '#f5eefc';
      ctx.fillRect(-8, -8, rect.w + 16, rect.h + 16);
      const inner = { x: 0, y: 0, w: rect.w, h: rect.h };
      const photo = cell.photo != null ? state.photos[cell.photo] : null;
      if (photo) paintPhotoCell(ctx, photo, inner, cell, grade.photo);
      else paintEmptyCell(ctx, inner);
      ctx.restore();
    } else {
      const photo = cell.photo != null ? state.photos[cell.photo] : null;
      if (photo) paintPhotoCell(ctx, photo, rect, cell, grade.photo);
      else paintEmptyCell(ctx, rect);
      ctx.restore();
    }
    // Role caption chip on the cell, when captions are on — skipped when its
    // box would sit under the title block.
    if (state.showCaptions) {
      const caption = cell.caption || '';
      const box = roleChipBox(ctx, caption, rect);
      const overlapsTitle =
        box &&
        box.x < titleZone.x + titleZone.w &&
        box.x + box.w > titleZone.x &&
        box.y < titleZone.y + titleZone.h &&
        box.y + box.h > titleZone.y;
      if (box && !overlapsTitle) paintRoleChip(ctx, caption, rect);
    }
  }

  // Title block over the layout's title zone.
  paintTitleBlock(ctx, state, titleZone, w);

  // The grade wash, grain and vignette finish the poster.
  ctx.save();
  ctx.globalCompositeOperation = grade.wash.mode;
  ctx.fillStyle = washGradient(ctx, grade, w, h);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = grainTexture(ctx);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(10, 4, 24, 0)');
  vig.addColorStop(1, 'rgba(10, 4, 24, 0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Selection outline, editor preview only.
  if (state.showSelection && state.selected != null && rects[state.selected]) {
    const r = rects[state.selected];
    ctx.save();
    ctx.strokeStyle = '#ffd319';
    ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.006);
    ctx.setLineDash([Math.max(8, w * 0.012), Math.max(6, w * 0.008)]);
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.restore();
  }
  ctx.restore();
}
