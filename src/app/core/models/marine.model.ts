import { GeoPoint, LocationId } from './location.model';
import { IsoInstant } from './weather.model';

/** One train of waves: the swell that arrives from far away, or the local wind sea. */
export interface WaveComponent {
  readonly heightM: number;
  readonly periodS: number;
  /** Direction the waves come from. Never shown as degrees. */
  readonly fromDegrees: number;
}

export interface SeaSnapshot {
  readonly time: IsoInstant;
  /** Significant height of all waves together. */
  readonly waveHeightM: number;
  readonly wavePeriodS: number;
  /** Direction the waves come from. Never shown as degrees. */
  readonly waveFromDegrees: number;
  /** Mar de fondo; null when the provider does not separate it. */
  readonly swell: WaveComponent | null;
  /** Null when the provider has no value for this hour. */
  readonly waterTemperatureC: number | null;
}

export interface SeaForecast {
  readonly locationId: LocationId;
  /** When this forecast was retrieved from the provider. */
  readonly issuedAt: IsoInstant;
  /** Open-water point the forecast describes. */
  readonly point: GeoPoint;
  readonly current: SeaSnapshot;
  /** Hourly steps starting at the current hour. */
  readonly hourly: readonly SeaSnapshot[];
}

export type TideKind = 'pleamar' | 'bajamar';

export interface TideExtreme {
  readonly kind: TideKind;
  readonly time: IsoInstant;
  readonly heightM: number;
}

export interface TidePoint {
  readonly time: IsoInstant;
  readonly heightM: number;
}

/**
 * Where a tide prediction comes from. Only `station` and `reference` are
 * official predictions; `model` is an estimate from an ocean model and must
 * never be presented as an official tide table.
 */
export interface TideSource {
  readonly kind: 'station' | 'reference' | 'model';
  readonly name: string;
  readonly official: boolean;
}

/** What heights are measured from: the port's chart datum, or mean sea level. */
export type TideDatum = 'chart' | 'mean-sea-level';

export interface TideForecast {
  readonly locationId: LocationId;
  readonly source: TideSource;
  readonly datum: TideDatum;
  /** Extremes from the start of the local day, at least 48 h ahead. */
  readonly extremes: readonly TideExtreme[];
  /** Evenly spaced heights covering at least the local day. */
  readonly series: readonly TidePoint[];
}
