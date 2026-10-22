import { GeoPoint } from '../../../core/models';

/*
 * A stylised, hand-traced outline of Lanzarote and La Graciosa (approximate,
 * for orientation only — not a navigational chart). Points are latitude /
 * longitude pairs, projected with an equirectangular projection corrected
 * for latitude, then smoothed into curves.
 */

const BOUNDS = { west: -13.92, east: -13.4, north: 29.3, south: 28.82 };
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

type LatLon = readonly [number, number];

const LANZAROTE: readonly LatLon[] = [
  [29.244, -13.462],
  [29.232, -13.445],
  [29.222, -13.437],
  [29.2, -13.428],
  [29.172, -13.432],
  [29.147, -13.441],
  [29.133, -13.457],
  [29.104, -13.437],
  [29.073, -13.457],
  [29.045, -13.468],
  [29.02, -13.482],
  [29.0, -13.492],
  [28.972, -13.52],
  [28.957, -13.55],
  [28.947, -13.585],
  [28.944, -13.612],
  [28.93, -13.64],
  [28.918, -13.665],
  [28.913, -13.7],
  [28.893, -13.735],
  [28.87, -13.76],
  [28.84, -13.783],
  [28.852, -13.808],
  [28.86, -13.833],
  [28.855, -13.873],
  [28.89, -13.862],
  [28.935, -13.832],
  [28.955, -13.836],
  [28.979, -13.838],
  [29.002, -13.82],
  [29.026, -13.792],
  [29.048, -13.766],
  [29.07, -13.732],
  [29.092, -13.698],
  [29.112, -13.657],
  [29.122, -13.637],
  [29.13, -13.61],
  [29.126, -13.583],
  [29.115, -13.565],
  [29.13, -13.535],
  [29.16, -13.512],
  [29.19, -13.494],
  [29.215, -13.477],
  [29.235, -13.468],
];

const LA_GRACIOSA: readonly LatLon[] = [
  [29.238, -13.488],
  [29.229, -13.505],
  [29.236, -13.53],
  [29.255, -13.545],
  [29.276, -13.536],
  [29.29, -13.51],
  [29.282, -13.484],
  [29.258, -13.476],
];

/** Closed Catmull–Rom spline through the points, as cubic Béziers. */
function smoothClosed(points: readonly LatLon[]): string {
  const p = points.map(([latitude, longitude]) => project({ latitude, longitude }));
  const n = p.length;
  let d = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return `${d}Z`;
}

export const ISLAND_PATHS = {
  lanzarote: smoothClosed(LANZAROTE),
  graciosa: smoothClosed(LA_GRACIOSA),
};

/** Which side of its marker a label sits on, to keep the dense south-east readable. */
export const LABEL_SIDE: Readonly<Record<string, 'left' | 'right' | 'below' | 'above'>> = {
  orzola: 'left',
  famara: 'right',
  'el-golfo': 'left',
  'playa-blanca': 'left',
  'puerto-del-carmen': 'left',
  arrecife: 'below',
  'costa-teguise': 'right',
};
