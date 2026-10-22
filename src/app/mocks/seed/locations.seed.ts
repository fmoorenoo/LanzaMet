import { Location, LocationId } from '../../core/models';

/*
 * DEMO DATA — places are real, everything measured about them is simulated.
 * Tide coverage is deliberately uneven (a gauge, references, and none) so the
 * interface is exercised the way real providers will behave.
 */

const ARRECIFE_PORT = 'Puerto de Arrecife';

export const LOCATIONS_SEED: readonly Location[] = [
  {
    id: 'puerto-del-carmen',
    name: 'Puerto del Carmen',
    municipality: 'Tías',
    area: 'sur',
    kind: 'pueblo',
    summary: 'Avenida de playas largas, resguardada del alisio.',
    position: { latitude: 28.921, longitude: -13.668 },
    facing: 'S',
    horizon: 'fuerteventura',
    shore: 'arena-dorada',
    coverage: { sea: true, tide: { kind: 'reference', stationName: ARRECIFE_PORT } },
  },
  {
    id: 'arrecife',
    name: 'Arrecife',
    municipality: 'Arrecife',
    area: 'este',
    kind: 'ciudad',
    summary: 'La capital: paseo marítimo, charcos y la playa de El Reducto.',
    position: { latitude: 28.9625, longitude: -13.5477 },
    facing: 'SE',
    horizon: 'abierto',
    shore: 'arena-dorada',
    coverage: { sea: true, tide: { kind: 'station', stationName: ARRECIFE_PORT } },
  },
  {
    id: 'playa-blanca',
    name: 'Playa Blanca',
    municipality: 'Yaiza',
    area: 'sur',
    kind: 'pueblo',
    summary: 'Paseo frente a Fuerteventura y aguas casi siempre tranquilas.',
    position: { latitude: 28.8628, longitude: -13.8296 },
    facing: 'S',
    horizon: 'fuerteventura',
    shore: 'arena-dorada',
    coverage: { sea: true, tide: { kind: 'reference', stationName: ARRECIFE_PORT } },
  },
  {
    id: 'costa-teguise',
    name: 'Costa Teguise',
    municipality: 'Teguise',
    area: 'este',
    kind: 'pueblo',
    summary: 'Playas abiertas al alisio: territorio de windsurf.',
    position: { latitude: 29.0005, longitude: -13.4905 },
    facing: 'E',
    horizon: 'abierto',
    shore: 'arena-dorada',
    coverage: { sea: true, tide: { kind: 'reference', stationName: ARRECIFE_PORT } },
  },
  {
    id: 'famara',
    name: 'Famara',
    municipality: 'Teguise',
    area: 'norte',
    kind: 'playa',
    summary: 'Seis kilómetros de arena bajo el Risco. Olas y viento.',
    position: { latitude: 29.1155, longitude: -13.5565 },
    facing: 'NO',
    horizon: 'risco',
    shore: 'arena-dorada',
    coverage: { sea: true, tide: { kind: 'reference', stationName: ARRECIFE_PORT } },
  },
  {
    id: 'orzola',
    name: 'Órzola',
    municipality: 'Haría',
    area: 'norte',
    kind: 'pueblo',
    summary: 'Pueblo marinero frente a La Graciosa, con caletas de arena blanca.',
    position: { latitude: 29.2228, longitude: -13.4497 },
    facing: 'N',
    horizon: 'graciosa',
    shore: 'roca',
    coverage: { sea: true, tide: { kind: 'reference', stationName: ARRECIFE_PORT } },
  },
  {
    id: 'la-santa',
    name: 'La Santa',
    municipality: 'Tinajo',
    area: 'oeste',
    kind: 'pueblo',
    summary: 'Costa de lava abierta al Atlántico, con olas de las serias.',
    position: { latitude: 29.1117, longitude: -13.6545 },
    facing: 'NO',
    horizon: 'volcanes',
    shore: 'roca',
    coverage: { sea: true, tide: { kind: 'none' } },
  },
  {
    id: 'el-golfo',
    name: 'El Golfo',
    municipality: 'Yaiza',
    area: 'oeste',
    kind: 'costa',
    summary: 'Un cráter partido por el mar, playa negra y el Charco Verde.',
    position: { latitude: 28.979, longitude: -13.832 },
    facing: 'O',
    horizon: 'volcanes',
    shore: 'arena-negra',
    coverage: { sea: false, tide: { kind: 'none' } },
  },
  {
    id: 'papagayo',
    name: 'Papagayo',
    municipality: 'Yaiza',
    area: 'sur',
    kind: 'playa',
    summary: 'Calas doradas entre acantilados, dentro de un espacio protegido.',
    position: { latitude: 28.8455, longitude: -13.787 },
    facing: 'S',
    horizon: 'fuerteventura',
    shore: 'arena-dorada',
    coverage: { sea: true, tide: { kind: 'reference', stationName: ARRECIFE_PORT } },
  },
];

/** Simulation-only traits: how each place bends the island-wide weather. */
export interface ClimateTraits {
  /** Local acceleration of the wind (funnelling, open beaches). */
  readonly windFactor: number;
  /** Extra cloud that piles up with northerly flow. */
  readonly cloudiness: number;
  readonly temperatureOffsetC: number;
  readonly swellFactor: number;
  /** Tide arrives a few minutes later or earlier than at the reference port. */
  readonly tideDelayMin: number;
  readonly waterOffsetC: number;
}

export const CLIMATE_TRAITS: Readonly<Record<LocationId, ClimateTraits>> = {
  'puerto-del-carmen': {
    windFactor: 1,
    cloudiness: 0.04,
    temperatureOffsetC: 0.6,
    swellFactor: 1,
    tideDelayMin: 4,
    waterOffsetC: 0.3,
  },
  arrecife: {
    windFactor: 1,
    cloudiness: 0.1,
    temperatureOffsetC: 0,
    swellFactor: 1,
    tideDelayMin: 0,
    waterOffsetC: 0,
  },
  'playa-blanca': {
    windFactor: 1,
    cloudiness: 0.03,
    temperatureOffsetC: 0.9,
    swellFactor: 0.9,
    tideDelayMin: 9,
    waterOffsetC: 0.4,
  },
  'costa-teguise': {
    windFactor: 1.18,
    cloudiness: 0.12,
    temperatureOffsetC: -0.3,
    swellFactor: 1,
    tideDelayMin: -2,
    waterOffsetC: -0.1,
  },
  famara: {
    windFactor: 1.22,
    cloudiness: 0.32,
    temperatureOffsetC: -1.3,
    swellFactor: 1.25,
    tideDelayMin: 14,
    waterOffsetC: -0.6,
  },
  orzola: {
    windFactor: 1.1,
    cloudiness: 0.26,
    temperatureOffsetC: -1,
    swellFactor: 1,
    tideDelayMin: 6,
    waterOffsetC: -0.5,
  },
  'la-santa': {
    windFactor: 1.05,
    cloudiness: 0.2,
    temperatureOffsetC: -0.8,
    swellFactor: 1.3,
    tideDelayMin: 16,
    waterOffsetC: -0.4,
  },
  'el-golfo': {
    windFactor: 1,
    cloudiness: 0.06,
    temperatureOffsetC: 0.4,
    swellFactor: 1.1,
    tideDelayMin: 18,
    waterOffsetC: 0.1,
  },
  papagayo: {
    windFactor: 0.9,
    cloudiness: 0.02,
    temperatureOffsetC: 0.7,
    swellFactor: 0.85,
    tideDelayMin: 8,
    waterOffsetC: 0.4,
  },
};
