/*
 * Response shapes of the Open-Meteo APIs as this app requests them
 * (`timeformat=unixtime`, `timezone=Atlantic/Canary`, metric units). Every
 * value can be null: models have gaps, and the mappers must not assume
 * otherwise. Verified against live responses on 2026-10-22.
 */

type Series = readonly (number | null)[];

interface PlaceDto {
  readonly latitude: number;
  readonly longitude: number;
  readonly utc_offset_seconds: number;
  readonly timezone: string;
}

/** https://open-meteo.com/en/docs */
export interface ForecastDto extends PlaceDto {
  readonly elevation: number;
  readonly current: {
    readonly time: number;
    readonly temperature_2m: number | null;
    readonly apparent_temperature: number | null;
    readonly is_day: number | null;
    readonly weather_code: number | null;
    readonly cloud_cover: number | null;
    readonly wind_speed_10m: number | null;
    readonly wind_direction_10m: number | null;
    readonly wind_gusts_10m: number | null;
    readonly uv_index: number | null;
  };
  readonly hourly: {
    readonly time: readonly number[];
    readonly temperature_2m: Series;
    readonly apparent_temperature: Series;
    readonly weather_code: Series;
    readonly cloud_cover: Series;
    readonly precipitation_probability: Series;
    readonly uv_index: Series;
    readonly wind_speed_10m: Series;
    readonly wind_direction_10m: Series;
    readonly wind_gusts_10m: Series;
    readonly is_day: Series;
  };
  readonly daily: {
    readonly time: readonly number[];
    readonly temperature_2m_max: Series;
    readonly temperature_2m_min: Series;
    readonly sunrise: Series;
    readonly sunset: Series;
    readonly uv_index_max: Series;
    readonly precipitation_probability_max: Series;
    readonly wind_speed_10m_max: Series;
    readonly wind_direction_10m_dominant: Series;
  };
}

/** https://open-meteo.com/en/docs/marine-weather-api */
export interface MarineDto extends PlaceDto {
  readonly hourly: {
    readonly time: readonly number[];
    readonly wave_height: Series;
    readonly wave_direction: Series;
    readonly wave_period: Series;
    readonly swell_wave_height: Series;
    readonly swell_wave_direction: Series;
    readonly swell_wave_period: Series;
    readonly sea_surface_temperature: Series;
    readonly sea_level_height_msl: Series;
  };
}

/** https://open-meteo.com/en/docs/air-quality-api — CAMS global (CAMS Europe stops north of 30° N). */
export interface AirQualityDto extends PlaceDto {
  readonly hourly: {
    readonly time: readonly number[];
    /** Saharan dust near the surface, µg/m³. */
    readonly dust: Series;
  };
}

/** Open-Meteo answers with a list for several coordinates and an object for one. */
export function asList<T>(body: T | readonly T[]): readonly T[] {
  return Array.isArray(body) ? body : [body as T];
}

export function isProviderError(body: unknown): body is { error: true; reason: string } {
  return typeof body === 'object' && body !== null && (body as { error?: unknown }).error === true;
}
