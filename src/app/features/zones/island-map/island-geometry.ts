import { GeoPoint } from '../../../core/models';
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
  'el-golfo': 'left',
  'playa-blanca': 'left',
  'puerto-del-carmen': 'left',
  arrecife: 'below',
  'costa-teguise': 'right',
};
