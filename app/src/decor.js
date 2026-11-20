// Original vector decoration, drawn in canvas: a retro striped sun, a Vice City
// skyline silhouette with lit windows, palm trees and a halftone corner. All of
// it is the app's own drawing — no borrowed art — and every random choice comes
// from a seeded generator, so two renders of the same cover match byte for byte.

/** A tiny deterministic generator, so the skyline never changes between renders. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A retro sun: a disc with horizontal slats cut out of its lower half. */
export function drawRetroSun(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  let y = cy + r * 0.05;
  let gap = r * 0.07;
  while (y < cy + r) {
    ctx.fillRect(cx - r - 1, y, r * 2 + 2, gap);
    y += gap + r * 0.13;
    gap *= 1.35;
  }
  ctx.restore();
}

/** A sun glow: soft radial light behind the sun disc. */
export function drawSunGlow(ctx, cx, cy, r, color) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.6);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 2.6, cy - r * 2.6, r * 5.2, r * 5.2);
  ctx.restore();
}

/** A skyline silhouette along the bottom: towers of many heights, lit windows. */
export function drawSkyline(ctx, w, h, seed, color, windowColor) {
  const rnd = mulberry32(seed);
  const base = h;
  const minH = h * 0.06;
  const maxH = h * 0.3;
  ctx.save();
  ctx.fillStyle = color;
  let x = 0;
  while (x < w) {
    const bw = w * (0.04 + rnd() * 0.07);
    const bh = minH + rnd() * (maxH - minH);
    ctx.fillRect(x, base - bh, bw, bh);
    // A rooftop antenna on the tallest towers.
    if (bh > maxH * 0.75) {
      ctx.fillRect(x + bw / 2 - 1, base - bh - h * 0.03, 2, h * 0.03);
    }
    // Lit windows, a sparse deterministic scatter.
    ctx.fillStyle = windowColor;
    const cols = Math.max(1, Math.floor(bw / (w * 0.018)));
    const rows = Math.max(1, Math.floor(bh / (h * 0.03)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() < 0.28) {
          ctx.fillRect(
            x + w * 0.008 + c * (w * 0.018),
            base - bh + h * 0.012 + r * (h * 0.03),
            w * 0.007,
            h * 0.012,
          );
        }
      }
    }
    ctx.fillStyle = color;
    x += bw + w * 0.006;
  }
  ctx.restore();
}

/** One palm tree: a curved trunk and six drooping fronds. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk, leaning slightly, drawn as two strokes so it tapers.
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.5, x + s * 0.3, y - s * 0.92);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(x + s * 0.05, y - s * 0.2);
  ctx.quadraticCurveTo(x + s * 0.16, y - s * 0.6, x + s * 0.3, y - s * 0.92);
  ctx.stroke();
  // Fronds fanning out from the crown.
  const cx = x + s * 0.3;
  const cy = y - s * 0.92;
  const fronds = [
    [-1.5, -0.45, -0.75, -0.15],
    [-1.05, -0.75, -0.45, -0.5],
    [-0.35, -0.9, 0.05, -0.75],
    [0.35, -0.85, 0.6, -0.5],
    [1.0, -0.6, 0.85, -0.2],
    [1.45, -0.25, 0.95, 0.1],
  ];
  ctx.lineWidth = Math.max(1, s * 0.045);
  for (const [dx1, dy1, dx2, dy2] of fronds) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + dx1 * s * 0.45, cy + dy1 * s * 0.45, cx + dx2 * s, cy + dy2 * s);
    ctx.stroke();
  }
  ctx.restore();
}

/** A halftone dot corner: rows of dots shrinking toward the corner. */
export function drawHalftone(ctx, x, y, w, h, color) {
  const step = Math.max(10, w / 22);
  ctx.save();
  ctx.fillStyle = color;
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const d = (row + col) / ((w + h) / step);
      const r = Math.max(0.6, step * 0.22 * (1 - d));
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** The full backdrop behind the panels: sky, sun glow, retro sun, skyline, palms. */
export function paintBackdrop(ctx, grade, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, grade.sky[0]);
  g.addColorStop(0.55, grade.sky[1]);
  g.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const sunX = w * 0.5;
  const sunY = h * 0.42;
  const sunR = Math.min(w, h) * 0.2;
  drawSunGlow(ctx, sunX, sunY, sunR, grade.sun);
  drawRetroSun(ctx, sunX, sunY, sunR, grade.sun);
  drawSkyline(ctx, w, h, 20261121, 'rgba(12, 4, 28, 0.92)', grade.sun);
  drawPalm(ctx, w * 0.06, h * 0.98, Math.min(w, h) * 0.34, 'rgba(10, 3, 24, 0.95)');
  drawPalm(ctx, w * 0.88, h * 0.99, Math.min(w, h) * 0.28, 'rgba(10, 3, 24, 0.95)');
  drawHalftone(ctx, w * 0.82, h * 0.02, w * 0.16, h * 0.12, 'rgba(255, 255, 255, 0.20)');
}
