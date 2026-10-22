import { GeoPoint, Location, LocationId } from '../models';

/*
 * The places the app knows. Coordinates are the town or beach itself; the
 * weather forecast is read there.
 *
 * Sea points: the marine model (Météo-France MFWAM / SMOC, 1/12° grid, served
 * by Open-Meteo) masks every cell that touches Lanzarote's coast, and asking
 * for a coastal coordinate silently snaps to the nearest sea cell — which for
 * Famara is north of La Graciosa and for El Golfo is a cell mostly over land.
 * So each place reads the sea at a grid cell chosen by hand: the nearest
 * open-water cell on the side its coast faces, checked against the grid on
 * 2026-10-22. Places that share a cell get the same sea, because the model
 * cannot tell them apart.
 *
 * Papagayo and La Santa were dropped in phase 3: they read the same model
 * cells as Playa Blanca and Famara, so they only repeated those forecasts.
 * Visitors who had them saved are moved to those places (`RETIRED_LOCATIONS`).
 */

/** Centres of the marine model's 1/12° cells around the island. */
const SEA = {
  bocaina: { latitude: 28.875, longitude: -13.791667 },
  southCoast: { latitude: 28.875, longitude: -13.625 },
  southOfArrecife: { latitude: 28.875, longitude: -13.541667 },
  eastCoast: { latitude: 28.958333, longitude: -13.375 },
  northwest: { latitude: 29.208333, longitude: -13.708333 },
  north: { latitude: 29.291667, longitude: -13.458333 },
  west: { latitude: 28.958333, longitude: -13.875 },
} as const satisfies Record<string, GeoPoint>;

export const LOCATIONS: readonly Location[] = [
  {
    id: 'puerto-del-carmen',
    name: 'Puerto del Carmen',
    municipality: 'Tías',
    area: 'sur',
    kind: 'pueblo',
    position: { latitude: 28.921, longitude: -13.668 },
    facing: 'S',
    horizon: 'fuerteventura',
    shore: 'arena-dorada',
    coverage: { sea: SEA.southCoast, tide: { kind: 'model' } },
  },
  {
    id: 'arrecife',
    name: 'Arrecife',
    municipality: 'Arrecife',
    area: 'este',
    kind: 'ciudad',
    position: { latitude: 28.9625, longitude: -13.5477 },
    facing: 'SE',
    horizon: 'abierto',
    shore: 'arena-dorada',
    coverage: { sea: SEA.southOfArrecife, tide: { kind: 'model' } },
  },
  {
    id: 'playa-blanca',
    name: 'Playa Blanca',
    municipality: 'Yaiza',
    area: 'sur',
    kind: 'pueblo',
    position: { latitude: 28.8628, longitude: -13.8296 },
    facing: 'S',
    horizon: 'fuerteventura',
    shore: 'arena-dorada',
    coverage: { sea: SEA.bocaina, tide: { kind: 'model' } },
  },
  {
    id: 'costa-teguise',
    name: 'Costa Teguise',
    municipality: 'Teguise',
    area: 'este',
    kind: 'pueblo',
    position: { latitude: 29.0005, longitude: -13.4905 },
    facing: 'E',
    horizon: 'abierto',
    shore: 'arena-dorada',
    coverage: { sea: SEA.eastCoast, tide: { kind: 'model' } },
  },
  {
    id: 'famara',
    name: 'Famara',
    municipality: 'Teguise',
    area: 'norte',
    kind: 'playa',
    position: { latitude: 29.1155, longitude: -13.5565 },
    facing: 'NO',
    horizon: 'risco',
    shore: 'arena-dorada',
    coverage: { sea: SEA.northwest, tide: { kind: 'model' } },
  },
  {
    id: 'orzola',
    name: 'Órzola',
    municipality: 'Haría',
    area: 'norte',
    kind: 'pueblo',
    position: { latitude: 29.2228, longitude: -13.4497 },
    facing: 'N',
    horizon: 'graciosa',
    shore: 'roca',
    coverage: { sea: SEA.north, tide: { kind: 'model' } },
  },
  {
    id: 'el-golfo',
    name: 'El Golfo',
    municipality: 'Yaiza',
    area: 'oeste',
    kind: 'costa',
    position: { latitude: 28.979, longitude: -13.832 },
    facing: 'O',
    horizon: 'volcanes',
    shore: 'arena-negra',
    coverage: { sea: SEA.west, tide: { kind: 'model' } },
  },
];

/** Places no longer in the catalogue, and the one that now stands for each. */
export const RETIRED_LOCATIONS: Readonly<Record<string, LocationId>> = {
  papagayo: 'playa-blanca',
  'la-santa': 'famara',
};
