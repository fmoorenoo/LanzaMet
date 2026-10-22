import { LocationId } from './location.model';

/** ISO-8601 instant in UTC, e.g. `2026-10-22T14:00:00.000Z`. */
export type IsoInstant = string;

/** Local calendar date in Lanzarote, `YYYY-MM-DD`. */
export type IsoDate = string;

export type SkyCondition =
  'despejado' | 'poco-nuboso' | 'nuboso' | 'cubierto' | 'calima' | 'lluvia';

export interface Wind {
  readonly speedKmh: number;
  readonly gustKmh: number;
  /** Direction the wind blows from. Kept for providers; never shown as degrees. */
  readonly fromDegrees: number;
}

export interface WeatherSnapshot {
  readonly time: IsoInstant;
  readonly temperatureC: number;
  readonly feelsLikeC: number;
  readonly sky: SkyCondition;
  /** 0–1 */
  readonly cloudCover: number;
  /** 0–1 */
  readonly precipitationChance: number;
  readonly uvIndex: number;
  readonly wind: Wind;
  readonly isDaylight: boolean;
}

export interface DailyForecast {
  readonly date: IsoDate;
  readonly minC: number;
  readonly maxC: number;
  readonly sky: SkyCondition;
  readonly precipitationChance: number;
  readonly maxWindKmh: number;
  readonly windFromDegrees: number;
  readonly uvMax: number;
  readonly sunrise: IsoInstant;
  readonly sunset: IsoInstant;
}

export interface WeatherForecast {
  readonly locationId: LocationId;
  readonly issuedAt: IsoInstant;
  readonly current: WeatherSnapshot;
  /** Hourly steps starting at the current hour (≥ 24 entries). */
  readonly hourly: readonly WeatherSnapshot[];
  /** Today first (7 entries). */
  readonly daily: readonly DailyForecast[];
}
