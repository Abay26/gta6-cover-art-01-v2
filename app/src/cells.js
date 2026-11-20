// Layout catalogue for Vice Press. Every layout is a grid of cells given as
// fractions of the cover (fx, fy, fw, fh in 0..1), so the same description works
// at any export size, plus a title zone in the same units. cellsForLayout turns
// the fractions into pixel rects; the renderer draws the title inside the zone
// and the photos inside the cells. No pixel maths lives in the catalogue.
export const CELL_GUTTER = 0.014;

/** All eight layouts, in the order the editor offers them. */
export const LAYOUTS = {
  hero: {
    label: 'Hero + 3',
    blurb: 'One big hero panel, three stacked beside it',
    cells: [
      { fx: 0, fy: 0, fw: 0.62, fh: 1 },
      { fx: 0.62, fy: 0, fw: 0.38, fh: 0.333 },
      { fx: 0.62, fy: 0.333, fw: 0.38, fh: 0.334 },
      { fx: 0.62, fy: 0.667, fw: 0.38, fh: 0.333 },
    ],
    title: { fx: 0.03, fy: 0.74, fw: 0.56, fh: 0.23, align: 'left' },
  },
  nine: {
    label: 'Nine Panel',
    blurb: 'The classic 3 x 3 poster grid',
    cells: [
      { fx: 0, fy: 0, fw: 0.334, fh: 0.334 },
      { fx: 0.334, fy: 0, fw: 0.333, fh: 0.334 },
      { fx: 0.667, fy: 0, fw: 0.333, fh: 0.334 },
      { fx: 0, fy: 0.334, fw: 0.334, fh: 0.333 },
      { fx: 0.334, fy: 0.334, fw: 0.333, fh: 0.333 },
      { fx: 0.667, fy: 0.334, fw: 0.333, fh: 0.333 },
      { fx: 0, fy: 0.667, fw: 0.334, fh: 0.333 },
      { fx: 0.334, fy: 0.667, fw: 0.333, fh: 0.333 },
      { fx: 0.667, fy: 0.667, fw: 0.333, fh: 0.333 },
    ],
    title: { fx: 0.02, fy: 0.8, fw: 0.96, fh: 0.18, align: 'center' },
  },
  tilt: {
    label: 'Tilted Snaps',
    blurb: 'Three tilted snapshots on a sunset sky',
    cells: [
      { fx: 0.04, fy: 0.22, fw: 0.36, fh: 0.5, tilt: -0.1 },
      { fx: 0.32, fy: 0.27, fw: 0.36, fh: 0.5, tilt: 0.02 },
      { fx: 0.6, fy: 0.22, fw: 0.36, fh: 0.5, tilt: 0.09 },
    ],
    title: { fx: 0.05, fy: 0.03, fw: 0.9, fh: 0.16, align: 'center' },
  },
  bleed: {
    label: 'Full Bleed',
    blurb: 'One photo edge to edge, title over it',
    cells: [{ fx: 0, fy: 0, fw: 1, fh: 1 }],
    title: { fx: 0.03, fy: 0.72, fw: 0.94, fh: 0.25, align: 'left' },
  },
  comic: {
    label: 'Comic Strip',
    blurb: 'Four vertical panels under one headline',
    cells: [
      { fx: 0, fy: 0.17, fw: 0.25, fh: 0.83 },
      { fx: 0.25, fy: 0.17, fw: 0.25, fh: 0.83 },
      { fx: 0.5, fy: 0.17, fw: 0.25, fh: 0.83 },
      { fx: 0.75, fy: 0.17, fw: 0.25, fh: 0.83 },
    ],
    title: { fx: 0.02, fy: 0.01, fw: 0.96, fh: 0.14, align: 'center' },
  },
  duo: {
    label: 'Duo Split',
    blurb: 'Two stacked frames, one story',
    cells: [
      { fx: 0, fy: 0, fw: 1, fh: 0.58 },
      { fx: 0, fy: 0.58, fw: 1, fh: 0.42 },
    ],
    title: { fx: 0.03, fy: 0.62, fw: 0.94, fh: 0.34, align: 'left' },
  },
  mosaic: {
    label: 'Mosaic 6',
    blurb: 'Six frames, three over three',
    cells: [
      { fx: 0, fy: 0, fw: 0.34, fh: 0.5 },
      { fx: 0.34, fy: 0, fw: 0.33, fh: 0.5 },
      { fx: 0.67, fy: 0, fw: 0.33, fh: 0.5 },
      { fx: 0, fy: 0.5, fw: 0.33, fh: 0.5 },
      { fx: 0.33, fy: 0.5, fw: 0.34, fh: 0.5 },
      { fx: 0.67, fy: 0.5, fw: 0.33, fh: 0.5 },
    ],
    title: { fx: 0.02, fy: 0.78, fw: 0.96, fh: 0.2, align: 'center' },
  },
  crew: {
    label: 'Crew Five',
    blurb: 'One wide hero over four role panels',
    cells: [
      { fx: 0, fy: 0, fw: 1, fh: 0.56 },
      { fx: 0, fy: 0.56, fw: 0.25, fh: 0.44 },
      { fx: 0.25, fy: 0.56, fw: 0.25, fh: 0.44 },
      { fx: 0.5, fy: 0.56, fw: 0.25, fh: 0.44 },
      { fx: 0.75, fy: 0.56, fw: 0.25, fh: 0.44 },
    ],
    title: { fx: 0.03, fy: 0.36, fw: 0.94, fh: 0.18, align: 'left' },
  },
};

/** How many cells a layout has. */
export function cellCount(key) {
  return LAYOUTS[key].cells.length;
}

/** Pixel rects for a layout at a cover of w by h, gutters cut evenly. */
export function cellsForLayout(key, w, h) {
  const g = Math.min(w, h) * CELL_GUTTER;
  const half = g / 2;
  return LAYOUTS[key].cells.map((c) => ({
    x: Math.round(c.fx * w + half),
    y: Math.round(c.fy * h + half),
    w: Math.round(c.fw * w - g),
    h: Math.round(c.fh * h - g),
    tilt: c.tilt || 0,
  }));
}

/** The title zone of a layout, in pixels. */
export function titleZoneFor(key, w, h) {
  const z = LAYOUTS[key].title;
  return {
    x: z.fx * w,
    y: z.fy * h,
    w: z.fw * w,
    h: z.fh * h,
    align: z.align,
  };
}

/** Which cell (index) contains point (px, py), or -1. Tilted cells test their rotated box. */
export function cellAtPoint(key, w, h, px, py) {
  const rects = cellsForLayout(key, w, h);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const dx = px - cx;
    const dy = py - cy;
    const cos = Math.cos(-r.tilt);
    const sin = Math.sin(-r.tilt);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    if (Math.abs(lx) <= r.w / 2 && Math.abs(ly) <= r.h / 2) return i;
  }
  return -1;
}
