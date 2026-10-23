import { GeoPoint } from '../../../core/models';
import { seeded } from '../../../shared/scene/geometry';
import { LA_GRACIOSA, LANZAROTE, MONTANA_CLARA } from './coastline';

/*
 * Lanzarote, La Graciosa and Montaña Clara as they are, from OpenStreetMap's
 * coastline (see coastline.ts; not a navigational chart). Every point, coast
 * and marker alike, goes through one projection: equirectangular, with
 * longitude scaled by the cosine of the island's latitude so a kilometre is
 * as long east–west as north–south.
 */

export type LatLon = readonly [number, number];

/** The frame: the whole of Lanzarote and the islets off its northern tip. */
const BOUNDS = { west: -13.92, east: -13.4, north: 29.315, south: 28.82 };
const LAT_SCALE = 1000 / (BOUNDS.north - BOUNDS.south);
const LON_SCALE = LAT_SCALE * Math.cos((29 * Math.PI) / 180);

export const MAP_SIZE = {
  width: Math.round((BOUNDS.east - BOUNDS.west) * LON_SCALE),
  height: 1000,
};

export function project(point: GeoPoint): { x: number; y: number } {
  return {
    x: (point.longitude - BOUNDS.west) * LON_SCALE,
    y: (BOUNDS.north - point.latitude) * LAT_SCALE,
  };
}

/** A closed outline through the coast's points (already dense: straight segments). */
function outline(points: readonly LatLon[]): string {
  return (
    points
      .map(([latitude, longitude], i) => {
        const { x, y } = project({ latitude, longitude });
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join('') + 'Z'
  );
}

export const ISLAND_PATHS = {
  lanzarote: outline(LANZAROTE),
  /** La Graciosa and Montaña Clara: islands of their own, across El Río. */
  islets: outline(LA_GRACIOSA) + outline(MONTANA_CLARA),
};

/*
 * The sea's texture, all static. Shoals: the coast drawn again under the land
 * as wide, faint strokes, so the water tints in steps towards the shore.
 * Swell marks: short double ripples scattered over open water, never on or
 * hugging the coast.
 */
export const COAST_PATH = ISLAND_PATHS.lanzarote + ISLAND_PATHS.islets;

const COAST_POINTS = [LANZAROTE, LA_GRACIOSA, MONTANA_CLARA].map((ring) =>
  ring.map(([latitude, longitude]) => project({ latitude, longitude })),
);

/** Distance in map units from a point to the nearest coast. */
function toCoast(x: number, y: number): number {
  let best = Infinity;
  for (const ring of COAST_POINTS) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const t = Math.max(
        0,
        Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)),
      );
      best = Math.min(best, Math.hypot(a.x + t * dx - x, a.y + t * dy - y));
    }
  }
  return best;
}

/** Whether a map point is on any of the islands (ray casting, in map units). */
function onLand(x: number, y: number): boolean {
  return COAST_POINTS.some((ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x)
        inside = !inside;
    }
    return inside;
  });
}

function swellMarks(): string {
  const random = seeded(29_0507);
  const step = 92;
  let d = '';
  for (let gy = step / 2; gy < MAP_SIZE.height; gy += step) {
    for (let gx = step / 2; gx < MAP_SIZE.width; gx += step) {
      // Jittered so the marks never line up into a grid.
      const x = gx + (random() - 0.5) * step * 0.8;
      const y = gy + (random() - 0.5) * step * 0.8;
      const half = 9 + random() * 7;
      if (random() < 0.35 || onLand(x, y) || toCoast(x, y) < 44) continue;
      d += `M${(x - half * 2).toFixed(1)} ${y.toFixed(1)}q${(half / 2).toFixed(1)} -${(half / 2.6).toFixed(1)} ${half.toFixed(1)} 0t${half.toFixed(1)} 0`;
    }
  }
  return d;
}

export const SWELL_MARKS = swellMarks();

/** Whether a point falls on Lanzarote's land as drawn (ray casting). */
export function onLanzarote({ latitude, longitude }: GeoPoint): boolean {
  let inside = false;
  for (let i = 0, j = LANZAROTE.length - 1; i < LANZAROTE.length; j = i++) {
    const [latI, lonI] = LANZAROTE[i];
    const [latJ, lonJ] = LANZAROTE[j];
    const crosses = latI > latitude !== latJ > latitude;
    if (crosses && longitude < ((lonJ - lonI) * (latitude - latI)) / (latJ - latI) + lonI) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Which side of its marker a label sits on: clear of La Graciosa and the El Río
 * strait (Órzola), and readable in the dense south-east.
 */
export const LABEL_SIDE: Readonly<Record<string, 'left' | 'right' | 'below' | 'above'>> = {
  orzola: 'below',
  famara: 'right',
  'la-santa': 'left',
  'el-golfo': 'left',
  'playa-blanca': 'left',
  'puerto-del-carmen': 'left',
  arrecife: 'below',
  'costa-teguise': 'right',
};
