import { LocationId } from './location.model';
import { IsoInstant } from './weather.model';

export interface SeaSnapshot {
  readonly time: IsoInstant;
  readonly waveHeightM: number;
  readonly wavePeriodS: number;
  /** Direction the swell comes from. Never shown as degrees. */
  readonly swellFromDegrees: number;
  readonly waterTemperatureC: number;
}

export interface SeaForecast {
  readonly locationId: LocationId;
  readonly issuedAt: IsoInstant;
  readonly current: SeaSnapshot;
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

export interface TideForecast {
  readonly locationId: LocationId;
  /** Where the prediction comes from: a local gauge or the nearest reference port. */
  readonly source: { readonly kind: 'station' | 'reference'; readonly stationName: string };
  /** Extremes from the start of the local day, at least 48 h ahead. */
  readonly extremes: readonly TideExtreme[];
  /** Evenly spaced heights covering at least the local day. */
  readonly series: readonly TidePoint[];
}
