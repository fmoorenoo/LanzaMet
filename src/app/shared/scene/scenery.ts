import { SceneryId } from '../../core/models';
import {
  cone,
  Feature,
  heightAt,
  HORIZON_VIEWBOX,
  ridge,
  seeded,
  silhouette,
  SILHOUETTE_STEP,
} from './geometry';

/*
 * Each place's own landmarks, drawn in the horizon's coordinates (1200×150,
 * the waterline at y = 150) so they stand on its land: the Gran Hotel over El
 * Reducto, the palms of Puerto del Carmen's promenade, the Pechiguera
 * lighthouse facing Lobos, Las Cucharas' breakwaters and windsurfers,
 * Órzola's harbour, El Golfo's half crater over the green lagoon.
 *
 * A few primitives (houses, a slab tower, palms, a lighthouse, a breakwater,
 * boats and sails) build them all. Every shape of one role shares one path,
 * so a scenery costs a handful of elements whatever it holds, and the paths
 * are computed once per place. Colours come from the scene's light.
 *
 * Tall things keep to the right: the words own the left of the sky, down to
 * about 45 units above the waterline on wide screens. Narrow scenes are
 * anchored to the right (`xMaxYMax slice`): a phone sees about x = 365…1200,
 * so what names a place sits there. On short phones the words reach the
 * horizon across most of the width, so anything tall stands right of
 * x = 1000 and the rest stays low.
 */

const BASE = HORIZON_VIEWBOX.height;

/** Something afloat, in the horizon's units; `y` is its waterline (> 150, on the sea). */
export interface Afloat {
  readonly kind: 'boat' | 'ferry' | 'sail';
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  /** Sails only: which of the scene's sail colours. */
  readonly tone: number;
}

export interface SceneryArt {
  /** Land the scenery stands on, painted like the near land. */
  readonly terrain: string;
  /** Bands of a cliff face, painted with the scene's rock colours in turn. */
  readonly strata: readonly string[];
  readonly lagoon: string;
  /** Sunlit walls, their shaded sides, small windows, and glass. */
  readonly walls: string;
  readonly shade: string;
  readonly windows: string;
  readonly glass: string;
  /** Palms, as strokes. */
  readonly trunks: string;
  readonly fronds: string;
  /** Lights that come on at dusk: lanterns and harbour beacons. */
  readonly lamps: readonly { readonly x: number; readonly y: number }[];
  /** Built into the sea: breakwaters and jetties. */
  readonly breakwater: string;
  readonly afloat: readonly Afloat[];
}

const f = (n: number) => n.toFixed(1);
const rect = (x: number, y: number, w: number, h: number) =>
  `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;

/** Collects shapes by role while a scenery is drawn. */
class Sketch {
  terrain: readonly Feature[] = [];
  strata: string[] = [];
  lagoon = '';
  walls = '';
  shade = '';
  windows = '';
  glass = '';
  trunks = '';
  fronds = '';
  lamps: { x: number; y: number }[] = [];
  breakwater = '';
  afloat: Afloat[] = [];

  /** Ground level at `x`: the waterline, or the scenery's own land. */
  ground(x: number): number {
    return BASE - heightAt(this.terrain, x);
  }

  /** A whitewashed block, lit from the left, with small windows when it is big enough. */
  house(x: number, w: number, h: number, base = this.ground(x + w / 2) + 1.5): this {
    const top = base - h;
    this.walls += rect(x, top, w, h);
    const side = Math.max(1.6, w * 0.24);
    this.shade += rect(x + w - side, top, side, h);
    // A parapet line, the flat roofs of the island.
    this.shade += rect(x, top, w - side, 0.9);
    for (let y = top + 3; y + 3.4 <= base - 1.5; y += 7) {
      for (let wx = x + 2.5; wx + 2 <= x + w - side - 1.5; wx += 7) {
        this.windows += rect(wx, y, 2, 2.4);
      }
    }
    return this;
  }

  /** Houses scattered over a stretch of land, the same on every render. */
  village(
    from: number,
    to: number,
    count: number,
    seed: number,
    size: { readonly w: readonly [number, number]; readonly h: readonly [number, number] },
  ): this {
    const random = seeded(seed);
    const between = ([min, max]: readonly [number, number]) => min + (max - min) * random();
    const houses = Array.from({ length: count }, (_, i) => {
      const x = from + ((to - from) * (i + random() * 0.8)) / count;
      const w = between(size.w);
      return { x: Math.min(x, HORIZON_VIEWBOX.width - w), w, h: between(size.h) };
    });
    // Taller ones behind, so the small ones in front stay readable.
    houses.sort((a, b) => b.h - a.h).forEach((h) => this.house(h.x, h.w, h.h));
    return this;
  }

  /**
   * The Arrecife Gran Hotel: a slender tower clad in blue-green glass, thin
   * light spandrels marking its floors and white edges, on a low podium,
   * crowned by the steel-and-glass roof of its top-floor restaurant.
   */
  tower(x: number, w: number, h: number, floors: number): this {
    const base = this.ground(x + w / 2) + 1;
    const top = base - h;
    const podium = 11;
    // Podium: a low white block either side of the tower's foot.
    this.house(x - w * 0.55, w * 2.1, podium, base);
    // The glass shaft, its shaded side a little darker.
    this.glass += rect(x, top, w, h - podium);
    const side = w * 0.26;
    this.shade += rect(x + w - side, top, 1.2, h - podium);
    // White edges and the floor lines across the glass.
    this.walls += rect(x, top, 1.4, h - podium);
    this.walls += rect(x + w - side - 1, top, 1, h - podium);
    const floor = (h - podium - 3) / floors;
    for (let i = 1; i <= floors; i++) {
      this.walls += rect(x, top + 3 + i * floor - 0.7, w, 0.7);
    }
    this.walls += rect(x - 0.8, top, w + 1.6, 2.2);
    // The roof: a narrower glass pavilion under a thin steel line.
    this.glass += rect(x + 3, top - 6, w - 6, 6);
    this.shade += rect(x + 2, top - 6.8, w - 4, 0.9);
    return this;
  }

  /** A palm: a leaning trunk and drooping fronds, as strokes. */
  palm(x: number, h: number, lean: number, base = this.ground(x) + 1): this {
    const tx = x + lean;
    const ty = base - h;
    this.trunks += `M${f(x)} ${f(base)}Q${f(x + lean * 0.15)} ${f(base - h * 0.55)} ${f(tx)} ${f(ty)}`;
    const length = h * 0.38;
    for (const angle of [168, 140, 108, 78, 44, 14]) {
      const a = (angle * Math.PI) / 180;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const droop = length * 0.55 * (1 - dy);
      this.fronds +=
        `M${f(tx)} ${f(ty)}` +
        `Q${f(tx + dx * length * 0.55)} ${f(ty - dy * length * 0.55 - length * 0.16)} ` +
        `${f(tx + dx * length)} ${f(ty - dy * length * 0.7 + droop)}`;
    }
    return this;
  }

  /** A tall, slender lighthouse with its lantern; the lantern lights up at dusk. */
  lighthouse(x: number, h: number): this {
    const base = this.ground(x) + 1;
    const top = base - h;
    const half = 4.2;
    this.walls += `M${f(x - half)} ${f(base)}L${f(x - half * 0.62)} ${f(top)}H${f(x + half * 0.62)}L${f(x + half)} ${f(base)}Z`;
    this.shade += `M${f(x + 1)} ${f(base)}L${f(x + 0.7)} ${f(top)}H${f(x + half * 0.62)}L${f(x + half)} ${f(base)}Z`;
    this.shade += rect(x - 4, top - 1.5, 8, 1.5);
    this.glass += rect(x - 2.2, top - 6.5, 4.4, 5);
    this.shade += `M${f(x - 2.8)} ${f(top - 6.5)}Q${f(x)} ${f(top - 10)} ${f(x + 2.8)} ${f(top - 6.5)}Z`;
    this.lamps.push({ x, y: top - 4 });
    return this;
  }

  /** A breakwater of piled rock lying on the water, from `from` to `to`. */
  mole(from: number, to: number, depth: number, beacon = false): this {
    const y = BASE + 0.4;
    let d = `M${f(from)} ${f(y + depth)}L${f(from)} ${f(y - 0.6)}`;
    // Boulders: a run of small humps.
    for (let x = from; x <= to; x += 5) {
      d += `Q${f(x + 2.5)} ${f(y - 2.6 - Math.abs(Math.sin(x * 0.9)) * 1.4)} ${f(x + 5)} ${f(y - 0.6)}`;
    }
    this.breakwater += `${d}L${f(to + 5)} ${f(y + depth)}Z`;
    if (beacon) {
      this.walls += rect(from + 1, y - 9, 2.4, 8);
      this.lamps.push({ x: from + 2.2, y: y - 10 });
    }
    return this;
  }

  float(kind: Afloat['kind'], x: number, y: number, scale: number, tone = 0): this {
    this.afloat.push({ kind, x, y, scale, tone });
    return this;
  }

  art(): SceneryArt {
    return {
      terrain: silhouette(this.terrain),
      strata: this.strata,
      lagoon: this.lagoon,
      walls: this.walls,
      shade: this.shade,
      windows: this.windows,
      glass: this.glass,
      trunks: this.trunks,
      fronds: this.fronds,
      lamps: this.lamps,
      breakwater: this.breakwater,
      afloat: this.afloat,
    };
  }
}

/**
 * Layers of ash and lava down a crater wall: each band follows the wall's
 * outline at a share of its height (`depths`, 0 at the rim … 1 at the
 * waterline), the way tuff settles over a cone. One path per band.
 */
function strata(cliff: readonly Feature[], depths: readonly number[]): string[] {
  const xs: number[] = [];
  for (let x = 0; x <= HORIZON_VIEWBOX.width; x += SILHOUETTE_STEP / 2) {
    if (heightAt(cliff, x) > 0.5) xs.push(x);
  }
  // A slight wave keeps the layers from reading as ruled lines.
  const at = (depth: number, x: number) => {
    const h = heightAt(cliff, x);
    const wave = depth > 0 && depth < 1 ? Math.sin(x * 0.031 + depth * 9) * 1.4 : 0;
    return f(Math.min(BASE, BASE - h * (1 - depth) + wave));
  };
  return depths.slice(1).map((lower, i) => {
    const top = xs.map((x) => `${x} ${at(depths[i], x)}`);
    const bottom = xs.map((x) => `${x} ${at(lower, x)}`).reverse();
    return `M${top.join('L')}L${bottom.join('L')}Z`;
  });
}

const SCENERIES: Readonly<Record<SceneryId, () => SceneryArt>> = {
  // Arrecife from El Reducto: the low white city along the seafront, its
  // palms, and the Gran Hotel, the island's only tower, glass on every floor.
  reducto: () =>
    new Sketch()
      .village(190, 480, 14, 11, { w: [14, 26], h: [4, 8] })
      .village(530, 1200, 26, 12, { w: [20, 38], h: [10, 28] })
      .tower(1020, 40, 75, 12)
      .palm(624, 38, 4)
      .palm(668, 45, -3)
      .palm(718, 34, 5)
      .palm(1110, 40, -4)
      .float('boat', 412, 157, 0.8)
      .art(),

  // Puerto del Carmen: a palm-lined promenade, the town climbing the slope
  // to the west, Fuerteventura and Lobos across the water.
  'playa-grande': () => {
    const sketch = new Sketch();
    sketch.terrain = [ridge(790, 1300, 26, 110, 0.12), cone(1130, 40, 170)];
    return sketch
      .village(800, 1190, 30, 21, { w: [10, 18], h: [6, 13] })
      .palm(628, 40, 5)
      .palm(668, 47, -4)
      .palm(708, 36, 6)
      .palm(748, 43, -2)
      .float('boat', 448, 159, 0.85)
      .art();
  },

  // Playa Blanca: low white houses along the front, Punta Pechiguera with its
  // 50 m lighthouse and the old one beside it, the ferry to Corralejo.
  pechiguera: () => {
    const sketch = new Sketch();
    sketch.terrain = [ridge(930, 1300, 9, 50, 0.2)];
    return sketch
      .village(480, 900, 20, 31, { w: [12, 22], h: [5, 10] })
      .palm(640, 30, 3)
      .palm(812, 34, -3)
      .house(1008, 12, 7)
      .house(1015, 5, 13)
      .lighthouse(1034, 74)
      .float('ferry', 420, 154, 0.8)
      .art();
  },

  // Costa Teguise at Las Cucharas: tidy blocks behind the promenade, palms in
  // between, rock breakwaters and, when the wind blows, windsurf sails.
  'las-cucharas': () => {
    const sketch = new Sketch();
    sketch.terrain = [ridge(620, 1300, 7, 60)];
    for (let i = 0; i < 10; i++) sketch.house(640 + i * 50, 36, i % 3 === 1 ? 20 : 16);
    for (const i of [1, 3, 5, 7, 9]) sketch.palm(634 + i * 50, 34, i % 4 === 1 ? 3 : -3);
    return sketch
      .mole(600, 664, 3)
      .mole(842, 900, 3)
      .mole(1090, 1150, 3)
      .float('sail', 372, 160, 0.9, 0)
      .float('sail', 540, 166, 1.1, 1)
      .float('sail', 760, 157, 0.75, 2)
      .art();
  },

  // Famara: the Risco is the horizon's; at its foot, the low bungalows, and
  // La Caleta's houses at the other end of the beach.
  famara: () => new Sketch().art(),

  // Órzola: white fishing houses on the point, the harbour mole with its
  // green light, boats at their moorings and the ferry to La Graciosa.
  orzola: () => {
    const sketch = new Sketch();
    sketch.terrain = [ridge(820, 1300, 13, 50, 0.15)];
    return sketch
      .village(830, 1140, 20, 51, { w: [10, 16], h: [6, 11] })
      .mole(640, 860, 4, true)
      .float('boat', 716, 158, 0.8)
      .float('boat', 792, 160, 0.95)
      .float('ferry', 470, 153.5, 0.7)
      .art();
  },

  // El Golfo: the half crater, its face banded ochre, rust and black, and the
  // Charco de los Clicos, green, at its foot.
  'el-golfo': () => {
    const sketch = new Sketch();
    const crater = [cone(840, 64, 130), cone(1100, 60, 120), ridge(780, 1170, 28, 36, 0.08)];
    sketch.terrain = crater;
    sketch.strata = strata(crater, [0, 0.16, 0.3, 0.42, 0.56, 0.68, 0.8, 1]);
    // The lagoon lies in the crater's bowl, behind a bar of black sand.
    sketch.lagoon = 'M900 150Q968 140 1036 150Z';
    return sketch.art();
  },
};

const sceneryCache = new Map<SceneryId, SceneryArt>();

export function sceneryArt(id: SceneryId): SceneryArt {
  let art = sceneryCache.get(id);
  if (!art) {
    art = SCENERIES[id]();
    sceneryCache.set(id, art);
  }
  return art;
}

/** Local shapes for things afloat, waterline at y = 0. */
export const AFLOAT_PATHS = {
  boat: {
    hull: 'M-11 -3H11L8 1H-8Z',
    stripe: 'M-10.6 -2H10.4L9.9 -1H-10Z',
    top: 'M-5 -3V-7H2V-3Z',
  },
  ferry: {
    hull: 'M-24 -4H24L20 1H-21Z',
    stripe: 'M-23.6 -2.4H23.4L23 -1.4H-23Z',
    top: 'M-16 -4V-9H11V-4ZM-10 -9V-11.5H3V-9Z',
  },
  sail: { hull: 'M-7 0H6L5 1H-6Z', stripe: '', top: 'M-1 -1V-18Q8.5 -10 6.5 -1Z' },
} as const;
