import { GeoPoint, Location } from '../../models';
import { ISLAND_TIME_ZONE } from '../../utils/time';

/*
 * The three Open-Meteo queries for the whole island, as plain URLs: one
 * request carries every place (the API takes lists of coordinates). The web
 * (OpenMeteoClient) and the Worker's widget (server/worker.ts) both build
 * them here, so they name the very same answers and share one cached copy
 * (server/open-meteo.ts).
 */

export const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
export const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
export const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const FORECAST_VARIABLES = {
  current: [
    'temperature_2m',
    'apparent_temperature',
    'is_day',
    'weather_code',
    'cloud_cover',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'uv_index',
  ],
  hourly: [
    'temperature_2m',
    'apparent_temperature',
    'weather_code',
    'cloud_cover',
    'precipitation_probability',
    'uv_index',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'is_day',
  ],
  daily: [
    'temperature_2m_max',
    'temperature_2m_min',
    'sunrise',
    'sunset',
    'uv_index_max',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'wind_speed_10m_mean',
    'wind_direction_10m_dominant',
  ],
};

const MARINE_VARIABLES = [
  'wave_height',
  'wave_direction',
  'wave_period',
  'swell_wave_height',
  'swell_wave_direction',
  'swell_wave_period',
  'sea_surface_temperature',
  'sea_level_height_msl',
];

/** Coordinates as the API wants them, rounded to what the grids can tell apart. */
function coordinates(points: readonly GeoPoint[]): Record<string, string> {
  return {
    latitude: points.map((p) => p.latitude.toFixed(4)).join(','),
    longitude: points.map((p) => p.longitude.toFixed(4)).join(','),
  };
}

function buildUrl(base: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `${base}?${query}`;
}

const COMMON = { timezone: ISLAND_TIME_ZONE, timeformat: 'unixtime' };

export function samePoint(a: GeoPoint, b: GeoPoint): boolean {
  return Math.abs(a.latitude - b.latitude) < 1e-4 && Math.abs(a.longitude - b.longitude) < 1e-4;
}

/** Same coordinates, same model cell: ask for each sea point only once. */
export function distinctSeaPoints(locations: readonly Location[]): GeoPoint[] {
  const points: GeoPoint[] = [];
  for (const location of locations) {
    const point = location.coverage.sea;
    if (point && !points.some((p) => samePoint(p, point))) points.push(point);
  }
  return points;
}

export interface IslandQueries {
  /** One answer per place, in `locations` order. */
  readonly forecast: string;
  /** One answer per place, in `locations` order. */
  readonly dust: string;
  /** One answer per sea point, in `seaPoints` order. */
  readonly marine: string;
  readonly seaPoints: readonly GeoPoint[];
}

export function islandQueries(locations: readonly Location[]): IslandQueries {
  const places = coordinates(locations.map((l) => l.position));
  const seaPoints = distinctSeaPoints(locations);
  return {
    forecast: buildUrl(FORECAST_URL, {
      ...places,
      current: FORECAST_VARIABLES.current.join(','),
      hourly: FORECAST_VARIABLES.hourly.join(','),
      daily: FORECAST_VARIABLES.daily.join(','),
      ...COMMON,
      forecast_days: '7',
    }),
    dust: buildUrl(AIR_QUALITY_URL, {
      ...places,
      hourly: 'dust',
      domains: 'cams_global',
      ...COMMON,
      forecast_days: '5',
    }),
    marine: buildUrl(MARINE_URL, {
      ...coordinates(seaPoints),
      hourly: MARINE_VARIABLES.join(','),
      ...COMMON,
      // Yesterday is needed to know the tide that came before this morning's;
      // the week ahead, so every day the app lets you choose has its sea and tide.
      past_days: '1',
      forecast_days: '7',
    }),
    seaPoints,
  };
}
