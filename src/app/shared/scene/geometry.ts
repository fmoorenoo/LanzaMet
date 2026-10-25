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
    }
  | {
      /** A drawn outline: [x, height] points, eased between, rough by `rough` units. */
      readonly kind: 'profile';
      readonly points: readonly (readonly [number, number])[];
      readonly rough: number;
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

export const profile = (points: readonly (readonly [number, number])[], rough = 0): Feature => ({
  kind: 'profile',
  points,
  rough,
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
  if (f.kind === 'profile') {
    const { points } = f;
    if (x <= points[0][0] || x >= points[points.length - 1][0]) return 0;
    const i = points.findIndex(([px]) => px > x) - 1;
    const [x0, h0] = points[i];
    const [x1, h1] = points[i + 1];
    const t = (1 - Math.cos((Math.PI * (x - x0)) / (x1 - x0))) / 2;
    const h = h0 + (h1 - h0) * t;
    // Broken rock, not a ruled line; it fades out where the outline meets the sea.
    const grain = Math.sin(x * 0.17) * 0.6 + Math.sin(x * 0.41 + 1.3) * 0.4;
    return Math.max(0, h + f.rough * grain * Math.min(1, h / 20));
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

/**
 * The modelling of near land, drawn over its flat fill: a lit band along the
 * crest and a shaded band at the foot (each following the outline at a share
 * of the height, slightly waved, the way lava and ash settle), and the line
 * of surf where the land meets the sea. No strokes on the slopes: the shape
 * of the hill is carried by light and shade alone.
 */
export interface Relief {
  readonly light: string;
  readonly shade: string;
  readonly surf: string;
}

const NO_RELIEF: Relief = { light: '', shade: '', surf: '' };

/** The band of land between two shares of its height (0 the crest … 1 the waterline). */
function band(features: readonly Feature[], from: number, to: number, step = 4): string {
  const { width, height } = HORIZON_VIEWBOX;
  const xs: number[] = [];
  for (let x = 0; x <= width; x += step) if (heightAt(features, x) > 1.5) xs.push(x);
  if (xs.length < 2) return '';
  const at = (depth: number, x: number) => {
    const h = heightAt(features, x);
    const wave =
      depth > 0 && depth < 1 ? Math.sin(x * 0.045 + depth * 7) * Math.min(2.2, h * 0.06) : 0;
    return (height - h * (1 - depth) + wave).toFixed(1);
  };
  // Runs of land, so separate hills make separate shapes.
  const runs: number[][] = [];
  xs.forEach((x, i) => {
    if (i === 0 || x - xs[i - 1] > step) runs.push([x]);
    else runs[runs.length - 1].push(x);
  });
  return runs
    .filter((run) => run.length > 1)
    .map((run) => {
      const top = run.map((x) => `${x} ${at(from, x)}`);
      const bottom = run.map((x) => `${x} ${at(to, x)}`).reverse();
      return `M${top.join('L')}L${bottom.join('L')}Z`;
    })
    .join('');
}

export function relief(features: readonly Feature[], seed: number): Relief {
  if (features.length === 0) return NO_RELIEF;
  const { width, height } = HORIZON_VIEWBOX;
  const random = seeded(seed);
  let surf = '';
  // Surf: short broken strokes where land stands at the waterline.
  for (let x = 0; x < width; x += 7) {
    if (heightAt(features, x) > 2 && heightAt(features, x + 7) > 2 && random() > 0.25) {
      surf += `M${x.toFixed(1)} ${height + 0.6}h${(3 + random() * 4).toFixed(1)}`;
    }
  }
  return {
    light: band(features, 0, 0.24),
    shade: band(features, 0.55, 1),
    surf,
  };
}

const PROFILES: Readonly<
  Record<HorizonProfile, { far: readonly Feature[]; near: readonly Feature[] }>
> = {
  abierto: {
    far: [ridge(-40, 150, 16, 90, 0.2), ridge(1060, 1240, 12, 80)],
    near: [],
  },
  // From Famara beach, looking north-east along the Risco: one unbroken wall.
  // It starts low at its northern tip by the sea (left), rises to a small
  // shoulder, dips at a saddle, then climbs steeply and keeps climbing, its
  // top almost level, to Peñas del Chache, the highest point, nearest (right).
  // La Graciosa and its islets lie low and far beyond the tip.
  risco: {
    far: [ridge(40, 330, 7, 55), cone(150, 28, 105, 14), cone(268, 19, 62), cone(352, 11, 34)],
    near: [
      profile(
        [
          [420, 0],
          [452, 9],
          [500, 24],
          [546, 33],
          [584, 39],
          [612, 37],
          [640, 35],
          [668, 41],
          [704, 56],
          [744, 72],
          [796, 85],
          [860, 95],
          [940, 104],
          [1020, 111],
          [1090, 117],
          [1150, 123],
          [1190, 127],
          [1225, 125],
          [1270, 126],
        ],
        1.4,
      ),
    ],
  },
  // From La Santa, across its bay: the Risco de Famara far off to the
  // right, a long flat-topped wall rising towards Peñas del Chache.
  bahia: {
    far: [
      profile(
        [
          [620, 0],
          [660, 7],
          [760, 13],
          [860, 20],
          [960, 27],
          [1060, 35],
          [1140, 41],
          [1200, 44],
          [1270, 45],
        ],
        0.8,
      ),
    ],
    near: [],
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
  // Arrieta seen from the water: the low coast of La Garita to the south
  // (left), and behind the village the slopes of the Haría massif climbing
  // north to Monte Corona, its crater broken on one side.
  corona: {
    far: [
      profile(
        [
          [470, 0],
          [540, 5],
          [640, 11],
          [730, 19],
          [800, 28],
          [860, 37],
          [905, 41],
          [950, 49],
          [990, 47],
          [1030, 56],
          [1200, 64],
          [1260, 66],
        ],
        1.1,
      ),
      cone(1100, 90, 118, 20),
    ],
    near: [ridge(560, 1300, 9, 70, 0.1)],
  },
};

export interface HorizonPaths {
  readonly far: string;
  /** A paler, nearer ridge inside the far range: two depths of distance. */
  readonly farRidge: string;
  readonly near: string;
  readonly nearRelief: Relief;
}

const horizonCache = new Map<HorizonProfile, HorizonPaths>();

export function horizonPaths(profile: HorizonProfile): HorizonPaths {
  let paths = horizonCache.get(profile);
  if (!paths) {
    const p = PROFILES[profile];
    paths = {
      far: silhouette(p.far),
      // The lower part of the far range, a step nearer: it reads as another
      // line of hills in front of the first.
      farRidge: band(p.far, 0.38, 1, 8),
      near: silhouette(p.near),
      nearRelief: relief(p.near, profile.length * 97),
    };
    horizonCache.set(profile, paths);
  }
  return paths;
}

/**
 * Small ripples on open water, in a 1000×100 box over the sea: closer
 * together and shorter towards the horizon, sparse near the shore, the same
 * on every render.
 */
function ripples(): string {
  const random = seeded(28_9625);
  let d = '';
  for (let i = 0; i < 56; i++) {
    const depth = Math.pow(random(), 1.7);
    const y = 2 + depth * 58;
    const x = random() * 1000;
    const length = 6 + depth * 26 + random() * 10;
    d += `M${x.toFixed(1)} ${y.toFixed(1)}h${length.toFixed(1)}`;
  }
  return d;
}

export const SEA_RIPPLES = ripples();

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
  { top: 14, width: 30, rest: 8, phase: 0.1, seconds: 150, layer: 1, shape: 0 },
  { top: 30, width: 22, rest: 58, phase: 0.55, seconds: 120, layer: 2, shape: 1 },
  { top: 8, width: 26, rest: 70, phase: 0.8, seconds: 170, layer: 1, shape: 2 },
  { top: 40, width: 18, rest: 24, phase: 0.3, seconds: 105, layer: 2, shape: 1 },
  { top: 22, width: 34, rest: 40, phase: 0.95, seconds: 190, layer: 1, shape: 2 },
  { top: 46, width: 20, rest: 82, phase: 0.68, seconds: 95, layer: 2, shape: 0 },
] as const;

/** Night sky: [x %, y % of the sky, radius], scattered from a fixed seed, fainter lower down. */
function stars(): readonly (readonly [number, number, number])[] {
  const random = seeded(29_1318);
  return Array.from({ length: 46 }, (_, i) => {
    const x = (i * 0.6180339887 + random() * 0.08) % 1;
    const y = Math.pow(random(), 1.4) * 64;
    // A few bright ones; most are pinpricks.
    const r = random() < 0.14 ? 0.32 + random() * 0.1 : 0.1 + random() * 0.16;
    return [Number((x * 100).toFixed(1)), Number(y.toFixed(1)), Number(r.toFixed(2))] as const;
  });
}

export const STARS = stars();

/**
 * Cumulus as they float over the island in the trade wind: rounded heaps on
 * top, a flat base where the air reaches condensation, in a 200×80 box
 * (base at y = 70). Painted top-lit, the base in shade.
 */
export const CLOUD_PATHS = [
  // A broad heap.
  'M10 70C2 70 2 58 12 55C10 44 22 36 34 40C38 26 56 20 68 28C76 12 104 8 116 22C124 14 144 14 152 28C166 24 182 34 180 48C192 50 196 62 188 70Z',
  // A small, taller tower.
  'M30 70C18 70 16 58 26 54C24 40 40 32 52 38C58 20 84 14 96 28C108 18 130 22 134 38C148 36 160 48 156 58C166 60 168 70 158 70Z',
  // A long, low bank, the trade wind's usual cloud.
  'M6 70C0 70 0 62 8 60C12 52 26 50 34 54C42 44 60 42 70 48C80 38 100 38 108 46C118 40 136 40 144 48C156 44 172 48 174 56C188 56 198 64 192 70Z',
] as const;

/** Where a cloud's lit top gives way to its shaded base, 0–1 of its height. */
export const CLOUD_SHADE_FROM = 0.5;

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
  /** The same resting values as numbers, for still drawings on a canvas (px are CSS px). */
  readonly still: {
    readonly x: number;
    readonly p: number;
    readonly w: number;
    readonly l: number;
    readonly o: number;
  };
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
    const still = {
      x: Number(x.toFixed(4)),
      p: Number(random().toFixed(3)),
      w: Number(between(depth.w).toFixed(2)),
      l: Number(between(depth.l).toFixed(1)),
      o: Number(between(depth.o).toFixed(2)),
    };
    const values = {
      x: still.x,
      p: still.p,
      w: still.w + 'px',
      l: still.l + 'px',
      o: still.o,
      t: t.toFixed(3) + 's',
      d: (-random() * t).toFixed(3) + 's',
    };
    return {
      style: Object.entries(values)
        .map(([key, value]) => `--${key}:${value}`)
        .join(';'),
      still,
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
