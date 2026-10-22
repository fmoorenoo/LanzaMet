import { GeoPoint } from './location.model';
import { IsoInstant } from './weather.model';

/*
 * Official information from the national weather service: warnings issued
 * under the Meteoalerta plan and what weather stations actually measured.
 * Both are observations or official statements, never model output.
 */

/** Meteoalerta levels worth telling anyone about (green means "no warning"). */
export type WarningLevel = 'amarillo' | 'naranja' | 'rojo';

export interface WeatherWarning {
  readonly id: string;
  readonly level: WarningLevel;
  /** "Costeros", "Lluvias", "Vientos"… as the issuer names it (in Spanish). */
  readonly phenomenon: string;
  /** Meteoalerta code ("CO", "PR", "VI"…): lets the interface name it in any language. */
  readonly phenomenonCode?: string | null;
  /** True when it applies to the coastal waters rather than the land. */
  readonly coastal: boolean;
  /** "Costa - Lanzarote" */
  readonly area: string;
  readonly onset: IsoInstant;
  readonly expires: IsoInstant;
  /** One sentence from the issuer: "Mar combinada del norte de 3 a 4 metros." */
  readonly description: string;
  /** The issuer's own English version of the description, when it publishes one. */
  readonly descriptionEn?: string | null;
  readonly url: string;
}

export interface WarningBulletin {
  readonly warnings: readonly WeatherWarning[];
  /** When the issuer last published, if known. */
  readonly publishedAt: IsoInstant | null;
  /** When this bulletin was retrieved. */
  readonly retrievedAt: IsoInstant;
}

/** One hourly reading from a weather station. Missing sensors stay null. */
export interface StationObservation {
  readonly stationId: string;
  readonly stationName: string;
  readonly position: GeoPoint;
  /** Height of the station; decides whether it can speak for the coast. */
  readonly altitudeM: number | null;
  /** End of the observed period. */
  readonly time: IsoInstant;
  readonly temperatureC: number | null;
  readonly windKmh: number | null;
  readonly gustKmh: number | null;
  readonly windFromDegrees: number | null;
  readonly humidity: number | null;
  readonly precipitationMm: number | null;
}
