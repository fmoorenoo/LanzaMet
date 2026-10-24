/*
 * The shared Open-Meteo cache: /api/open-meteo/{forecast,marine,air-quality}
 * take the same query the web would send to Open-Meteo and answer with
 * Open-Meteo's own JSON, unchanged. A visitor then costs Open-Meteo nothing
 * while a copy is fresh, and Open-Meteo sees Cloudflare's traffic, which is
 * what it recommends for Workers.
 *
 * It is not an open proxy: three services, only the parameters the web uses,
 * and only places in and around Lanzarote. Pure functions, tested without I/O.
 */

const MINUTE = 60_000;

export interface OpenMeteoService {
  readonly upstream: string;
  /** Kept a little shorter than the web's own cache, so the two never add up to much. */
  readonly ttlMs: number;
  /** Parameters accepted besides the coordinates, with a check for each value. */
  readonly params: Readonly<Record<string, (value: string) => boolean>>;
}

const VARIABLES = /^[a-z0-9_]+(,[a-z0-9_]+){0,29}$/;
const is = (expected: string) => (value: string) => value === expected;
const between = (min: number, max: number) => (value: string) =>
  /^\d{1,2}$/.test(value) && Number(value) >= min && Number(value) <= max;
const variables = (value: string) => VARIABLES.test(value);

const COMMON = {
  timezone: is('Atlantic/Canary'),
  timeformat: is('unixtime'),
};

export const OPEN_METEO_SERVICES: Readonly<Record<string, OpenMeteoService>> = {
  forecast: {
    upstream: 'https://api.open-meteo.com/v1/forecast',
    ttlMs: 10 * MINUTE,
    params: {
      ...COMMON,
      current: variables,
      hourly: variables,
      daily: variables,
      forecast_days: between(1, 7),
    },
  },
  marine: {
    upstream: 'https://marine-api.open-meteo.com/v1/marine',
    ttlMs: 30 * MINUTE,
    params: {
      ...COMMON,
      hourly: variables,
      past_days: between(0, 2),
      forecast_days: between(1, 7),
    },
  },
  'air-quality': {
    upstream: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    ttlMs: 60 * MINUTE,
    params: {
      ...COMMON,
      hourly: variables,
      domains: is('cams_global'),
      forecast_days: between(1, 7),
    },
  },
};

/** Lanzarote, La Graciosa, Lobos and the sea points around them, with room to spare. */
const BOUNDS = { south: 28.6, north: 29.45, west: -14.1, east: -13.2 } as const;
const MAX_POINTS = 12;
const COORDINATE = /^-?\d{1,3}(\.\d{1,4})?$/;

function coordinateList(value: string | null, min: number, max: number): number[] | null {
  if (value === null) return null;
  const parts = value.split(',');
  if (parts.length === 0 || parts.length > MAX_POINTS) return null;
  const numbers = parts.map((part) => (COORDINATE.test(part) ? Number(part) : NaN));
  return numbers.every((n) => n >= min && n <= max) ? numbers : null;
}

/**
 * The Open-Meteo URL for an accepted query, built exactly as the web builds
 * it (so both name the same answer), or null when the query isn't one the web makes.
 */
export function openMeteoUrl(service: OpenMeteoService, query: URLSearchParams): string | null {
  const seen = new Set<string>();
  const pairs: [string, string][] = [];
  for (const [name, value] of query) {
    if (seen.has(name)) return null;
    seen.add(name);
    pairs.push([name, value]);
  }
  const latitudes = coordinateList(query.get('latitude'), BOUNDS.south, BOUNDS.north);
  const longitudes = coordinateList(query.get('longitude'), BOUNDS.west, BOUNDS.east);
  if (!latitudes || !longitudes || latitudes.length !== longitudes.length) return null;
  for (const [name, value] of pairs) {
    if (name === 'latitude' || name === 'longitude') continue;
    const check = service.params[name];
    if (!check || !check(value)) return null;
  }
  const search = pairs.map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('&');
  return `${service.upstream}?${search}`;
}
