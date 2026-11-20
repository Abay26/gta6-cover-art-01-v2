// Colour grades and title lettering for Vice Press. A grade is a photo filter,
// a coloured wash over the whole cover (stops + blend mode), and the sky the
// backdrop paints behind the panels: sunset, neon and Vice City dusk, all the
// app's own palette — no artwork is borrowed.

/** The export sizes the editor offers, in pixels. */
export const SIZES = {
  square: { label: '1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 × 1350', w: 1080, h: 1350 },
  wide: { label: '1920 × 1080', w: 1920, h: 1080 },
};

/** Title lettering styles. Chrome is a 3D block: cyan and pink offsets under white. */
export const TITLE_STYLES = {
  gradient: { label: 'Sunset gradient' },
  solid: { label: 'Solid white' },
  outline: { label: 'Neon outline' },
  chrome: { label: 'Chrome block' },
};

/** One grade: a CSS filter for each photo, a wash, and a sky of three colours. */
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    photo: 'saturate(1.35) contrast(1.08) brightness(1.02)',
    wash: {
      mode: 'overlay',
      stops: [
        [0, 'rgba(255, 150, 60, 0.10)'],
        [0.55, 'rgba(255, 80, 120, 0.10)'],
        [1, 'rgba(140, 30, 255, 0.22)'],
      ],
    },
    sky: ['#2b1055', '#ff7e2e', '#ffd319'],
    sun: '#ffd319',
  },
  neon: {
    label: 'Neon Night',
    photo: 'saturate(1.5) contrast(1.15) brightness(0.95)',
    wash: {
      mode: 'overlay',
      stops: [
        [0, 'rgba(255, 41, 117, 0.16)'],
        [0.5, 'rgba(20, 10, 60, 0.05)'],
        [1, 'rgba(34, 230, 210, 0.20)'],
      ],
    },
    sky: ['#0d0221', '#ff2975', '#22e6d2'],
    sun: '#ff7ad9',
  },
  teal: {
    label: 'Palm Teal',
    photo: 'saturate(1.25) contrast(1.05) sepia(0.12)',
    wash: {
      mode: 'soft-light',
      stops: [
        [0, 'rgba(34, 230, 210, 0.12)'],
        [1, 'rgba(255, 170, 60, 0.14)'],
      ],
    },
    sky: ['#062a33', '#22e6d2', '#ffd319'],
    sun: '#ffe9a8',
  },
  haze: {
    label: 'Heat Haze',
    photo: 'saturate(1.15) contrast(0.95) brightness(1.08) sepia(0.22)',
    wash: {
      mode: 'soft-light',
      stops: [
        [0, 'rgba(255, 200, 120, 0.16)'],
        [1, 'rgba(255, 120, 60, 0.10)'],
      ],
    },
    sky: ['#4a2b18', '#ff9a3d', '#ffe9a8'],
    sun: '#ffe9a8',
  },
  noir: {
    label: 'Noir',
    photo: 'grayscale(1) contrast(1.25) brightness(0.92)',
    wash: {
      mode: 'overlay',
      stops: [
        [0, 'rgba(255, 41, 117, 0.10)'],
        [1, 'rgba(10, 10, 30, 0.18)'],
      ],
    },
    sky: ['#111122', '#3d2b56', '#8c8ca8'],
    sun: '#e8e8f2',
  },
  gold: {
    label: 'Bayside Gold',
    photo: 'saturate(1.3) contrast(1.1) brightness(1.05) sepia(0.18)',
    wash: {
      mode: 'soft-light',
      stops: [
        [0, 'rgba(255, 210, 90, 0.16)'],
        [1, 'rgba(20, 90, 110, 0.14)'],
      ],
    },
    sky: ['#0a2a3d', '#f2b705', '#fff3b0'],
    sun: '#ffe9a8',
  },
  midnight: {
    label: 'Midnight Vice',
    photo: 'saturate(1.4) contrast(1.18) brightness(0.9)',
    wash: {
      mode: 'overlay',
      stops: [
        [0, 'rgba(120, 40, 220, 0.18)'],
        [0.6, 'rgba(10, 10, 40, 0.06)'],
        [1, 'rgba(255, 41, 117, 0.22)'],
      ],
    },
    sky: ['#070418', '#6d28d9', '#ff2975'],
    sun: '#ff7ad9',
  },
  candy: {
    label: 'Candy Floss',
    photo: 'saturate(1.45) contrast(1.02) brightness(1.06)',
    wash: {
      mode: 'soft-light',
      stops: [
        [0, 'rgba(255, 120, 200, 0.14)'],
        [1, 'rgba(120, 230, 210, 0.14)'],
      ],
    },
    sky: ['#3d0c4d', '#ff7ad9', '#a7f3ea'],
    sun: '#ffd6f2',
  },
};

/** Builds a vertical gradient from a grade's wash stops. */
export function washGradient(ctx, grade, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [pos, color] of grade.wash.stops) g.addColorStop(pos, color);
  return g;
}

/** The three-colour sunset gradient a grade paints as the cover's sky. */
export function skyGradient(ctx, grade, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, grade.sky[0]);
  g.addColorStop(0.55, grade.sky[1]);
  g.addColorStop(1, grade.sky[2]);
  return g;
}
