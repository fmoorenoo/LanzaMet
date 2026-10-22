import { LOCATIONS } from '../../core/data/locations';
import { DataCoverage, Location, LocationId } from '../../core/models';

/*
 * DEMO DATA — places are real (the app catalogue), everything measured about
 * them is simulated. Coverage is deliberately uneven here (a gauge,
 * references, and none) so the interface keeps exercising the states real
 * providers can produce.
 */

const ARRECIFE_PORT = 'Puerto de Arrecife';
const reference: DataCoverage['tide'] = { kind: 'reference', stationName: ARRECIFE_PORT };

const DEMO_COVERAGE: Readonly<Record<LocationId, Partial<DataCoverage>>> = {
  arrecife: { tide: { kind: 'station', stationName: ARRECIFE_PORT } },
  'la-santa': { tide: { kind: 'none' } },
  'el-golfo': { sea: null, tide: { kind: 'none' } },
};

export const LOCATIONS_SEED: readonly Location[] = LOCATIONS.map((location) => ({
  ...location,
  coverage: { ...location.coverage, tide: reference, ...DEMO_COVERAGE[location.id] },
}));

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
