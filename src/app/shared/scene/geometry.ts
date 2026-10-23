import { SeaLevel } from '../../core/insights/sea.insight';
import { HorizonProfile, ShoreKind } from '../../core/models';

/*
 * Authored geometry for the scene. Horizons are built from a few volcanic
 * primitives so each place gets its own skyline: La Graciosa seen from the
 * north, the Risco above Famara, Fuerteventura from the south coast and,
 * closer, across the Bocaina strait, Timanfaya's cones on the west coast.
 * What people built (towns, towers, harbours) lives in `scenery.ts`.
 */

export const HORIZON_VIEWBOX = { width: 1200, height: 150 } as const;

export type Feature =
  | {
      readonly kind: 'cone';
      readonly x: number;
      readonly h: number;
      readonly w: number;
      readonly crater?: number;
    }
  | {
      readonly kind: 'ridge';
      readonly from: number;
      readonly to: number;
      readonly h: number;
      readonly soft: number;
      readonly wobble?: number;
    };

export const cone = (x: number, h: number, w: number, crater = 0): Feature => ({
  kind: 'cone',
  x,
  h,
  w,
  crater,
});
export const ridge = (from: number, to: number, h: number, soft: number, wobble = 0): Feature => ({
  kind: 'ridge',
  from,
  to,
  h,
  soft,
  wobble,
});

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function featureHeight(f: Feature, x: number): number {
  if (f.kind === 'cone') {
    const d = Math.abs(x - f.x);
    if (d >= f.w) return 0;
    const crater = f.crater ?? 0;
    const rim = f.h * Math.pow(1 - crater / f.w, 1.6);
    if (d < crater) return rim - f.h * 0.05 * (1 - d / crater);
    return f.h * Math.pow(1 - d / f.w, 1.6);
  }
  const rise = smoothstep(f.from - f.soft, f.from + f.soft * 0.2, x);
  const fall = 1 - smoothstep(f.to - f.soft * 0.2, f.to + f.soft, x);
  const wobble = 1 + (f.wobble ?? 0) * (Math.sin(x * 0.021) * 0.6 + Math.sin(x * 0.057) * 0.4);
  return f.h * rise * fall * wobble;
}

/** Height of the land at `x`: the tallest feature there. */
export function heightAt(features: readonly Feature[], x: number): number {
  return Math.max(0, ...features.map((f) => featureHeight(f, x)));
}

/** Horizontal step the silhouettes are sampled at. */
export const SILHOUETTE_STEP = 8;

export function silhouette(features: readonly Feature[]): string {
  if (features.length === 0) return '';
  const { width, height } = HORIZON_VIEWBOX;
  let d = `M0 ${height}`;
  for (let x = 0; x <= width; x += SILHOUETTE_STEP) {
    d += `L${x} ${(height - heightAt(features, x)).toFixed(1)}`;
  }
  return `${d}L${width} ${height}Z`;
}

const PROFILES: Readonly<
  Record<HorizonProfile, { far: readonly Feature[]; near: readonly Feature[] }>
> = {
  abierto: {
    far: [ridge(-40, 150, 16, 90, 0.2), ridge(1060, 1240, 12, 80)],
    near: [],
  },
  risco: {
    far: [ridge(150, 470, 7, 60), cone(260, 27, 120, 18), cone(372, 17, 72)],
    near: [ridge(730, 1280, 108, 70, 0.07)],
  },
  graciosa: {
    far: [
      ridge(260, 960, 9, 70),
      cone(440, 42, 130, 22),
      cone(650, 30, 105, 14),
      cone(830, 22, 80),
    ],
    near: [ridge(1060, 1300, 34, 60, 0.15)],
  },
  fuerteventura: {
    far: [
      ridge(40, 1160, 10, 140, 0.25),
      cone(330, 24, 300),
      cone(760, 32, 330),
      cone(1010, 16, 70, 14),
    ],
    near: [],
  },
  // From Playa Blanca, across the Bocaina: Lobos and its crater in front,
  // Fuerteventura close and long behind, with the volcanoes above Corralejo.
  bocaina: {
    far: [
      ridge(-40, 1240, 17, 120, 0.3),
      cone(330, 30, 92, 14),
      cone(610, 34, 150, 10),
      cone(790, 46, 190),
      cone(965, 30, 130, 12),
      cone(1120, 24, 110),
    ],
    near: [],
  },
  volcanes: {
    far: [cone(560, 30, 150, 16), cone(380, 18, 110)],
    near: [cone(920, 76, 230, 44), cone(1140, 54, 170, 24), ridge(800, 1300, 10, 80)],
  },
};

const horizonCache = new Map<HorizonProfile, { far: string; near: string }>();

export function horizonPaths(profile: HorizonProfile): { far: string; near: string } {
  let paths = horizonCache.get(profile);
  if (!paths) {
    const p = PROFILES[profile];
    paths = { far: silhouette(p.far), near: silhouette(p.near) };
    horizonCache.set(profile, paths);
  }
  return paths;
}

/*
 * Shores are drawn in a 100×100 box stretched over the lower sea, so the
 * waterline (which moves with the tide) always crosses them: more beach at
 * low tide, a sliver at high tide.
 */
const SHORES: Readonly<Record<ShoreKind, string>> = {
  'arena-dorada': 'M0 100V20C14 21 30 46 54 100Z',
  'arena-negra': 'M0 100V24C15 25 32 50 50 100Z',
  roca: 'M0 100V12L4 9L8 15L12 12L17 22L21 20L25 33L30 37L34 52L38 55L46 100ZM84 100L87 82L91 78L95 84L100 80V100Z',
};

export function shorePath(kind: ShoreKind): string {
  return SHORES[kind];
}

/*
 * Waves are drawn twice as wide as the viewport so a -50% translation loops
 * seamlessly. Amplitude follows the sea state.
 */

export const WAVE_VIEWBOX = { width: 2400, height: 100, baseline: 22 } as const;

const AMPLITUDE: Readonly<Record<SeaLevel, number>> = { 0: 1.4, 1: 3, 2: 6, 3: 10, 4: 15 };

export interface WavePaths {
  readonly body: string;
  readonly crest: string;
}

export function wavePaths(level: SeaLevel, wavelength: number, scale: number): WavePaths {
  const { width, height, baseline } = WAVE_VIEWBOX;
  const amplitude = AMPLITUDE[level] * scale;
  const half = wavelength / 2;
  let crest = `M0 ${baseline}Q${half / 2} ${baseline - amplitude} ${half} ${baseline}`;
  for (let x = half; x < width; x += half) crest += `T${x + half} ${baseline}`;
  return { crest, body: `${crest}V${height}H0Z` };
}

/** Seconds for one loop, per layer, at a calm sea. */
export const WAVE_DURATIONS = [30, 21, 14] as const;

export const SEA_SPEED: Readonly<Record<SeaLevel, number>> = {
  0: 0.55,
  1: 0.75,
  2: 1,
  3: 1.3,
  4: 1.6,
};

/**
 * Cloud placement: vertical position and size (% of scene), where it rests
 * when nothing drifts (mini scenes, reduced motion), and its phase and pace.
 */
export const CLOUDS = [
  { top: 14, width: 30, rest: 8, phase: 0.1, seconds: 150, layer: 1 },
  { top: 30, width: 22, rest: 58, phase: 0.55, seconds: 120, layer: 2 },
  { top: 8, width: 26, rest: 70, phase: 0.8, seconds: 170, layer: 1 },
  { top: 40, width: 18, rest: 24, phase: 0.3, seconds: 105, layer: 2 },
  { top: 22, width: 34, rest: 40, phase: 0.95, seconds: 190, layer: 1 },
  { top: 46, width: 20, rest: 82, phase: 0.68, seconds: 95, layer: 2 },
] as const;

/** Night sky: [x %, y % of the sky, radius]. */
export const STARS: readonly (readonly [number, number, number])[] = [
  [8, 12, 0.35],
  [18, 34, 0.25],
  [27, 8, 0.3],
  [36, 24, 0.22],
  [44, 44, 0.2],
  [52, 16, 0.32],
  [61, 30, 0.22],
  [68, 6, 0.28],
  [76, 22, 0.32],
  [84, 40, 0.2],
  [91, 12, 0.26],
  [96, 32, 0.22],
];

export const CLOUD_PATH =
  'M22 70C8 70 2 58 10 49 6 34 24 25 39 31 46 14 74 8 92 20 104 6 138 6 148 27 168 22 188 36 183 52 196 58 192 72 176 72Z';

// ── Rain ─────────────────────────────────────────────────────────────

/**
 * One streak of rain. Every streak falls along the same line (the scene's
 * fixed slant); what varies is where it starts, how far away it seems
 * (thinner, shorter, fainter and slower in the distance) and where in its
 * fall it is when the rain begins, so no two move in step.
 */
export interface RainDrop {
  /** Inline style: `--x` start across the sky (0–1), `--p` resting point of the fall (0–1)
   *  for still drawings, `--w`/`--l` width and length (px), `--o` opacity, `--t` seconds
   *  per fall, `--d` its (negative) delay. */
  readonly style: string;
}

/** Most streaks there can be; light rain draws the first ones only. */
const RAIN_MAX = 120;

/** A small seeded generator (mulberry32): the same rain on every render and device. */
export function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEPTHS = [
  // far: hairlines, faint and unhurried
  { share: 0.45, w: [0.8, 1], l: [12, 20], o: [0.24, 0.38], t: [1.05, 1.35] },
  // middle
  { share: 0.35, w: [1, 1.3], l: [18, 28], o: [0.38, 0.54], t: [0.8, 1] },
  // near: thicker, longer, brighter and quick
  { share: 0.2, w: [1.4, 1.8], l: [26, 40], o: [0.52, 0.72], t: [0.6, 0.75] },
] as const;

function rainDrops(): readonly RainDrop[] {
  const random = seeded(20261023);
  const between = ([min, max]: readonly [number, number]) => min + (max - min) * random();
  return Array.from({ length: RAIN_MAX }, (_, i) => {
    // A golden-ratio walk spreads any first n streaks over the whole sky;
    // the jitter breaks the regular spacing it would otherwise show.
    const x = (i * 0.6180339887 + 0.17 + ((random() - 0.5) * 0.9) / RAIN_MAX + 1) % 1;
    const roll = random();
    const depth = roll < DEPTHS[0].share ? DEPTHS[0] : roll < 0.8 ? DEPTHS[1] : DEPTHS[2];
    const t = between(depth.t);
    const values = {
      x: x.toFixed(4),
      p: random().toFixed(3),
      w: between(depth.w).toFixed(2) + 'px',
      l: between(depth.l).toFixed(1) + 'px',
      o: between(depth.o).toFixed(2),
      t: t.toFixed(3) + 's',
      d: (-random() * t).toFixed(3) + 's',
    };
    return {
      style: Object.entries(values)
        .map(([key, value]) => `--${key}:${value}`)
        .join(';'),
    };
  });
}

export const RAIN_DROPS = rainDrops();

/**
 * How many streaks to draw for a rain intensity (0–1): from 36 for drizzle to
 * 120 for a downpour, sized for a wide scene (narrow ones hide a third, in
 * CSS). Mini scenes keep a few, still.
 */
export function rainDropCount(intensity: number, mini: boolean): number {
  if (intensity <= 0) return 0;
  const count = Math.round(36 + 84 * Math.min(1, intensity));
  return mini ? Math.round(count / 3) : count;
}
