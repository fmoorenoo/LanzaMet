import {
  DailyForecast,
  GeoPoint,
  LocationId,
  SeaForecast,
  SeaSnapshot,
  SkyCondition,
  TideExtreme,
  TideForecast,
  TidePoint,
  WaveComponent,
  WeatherForecast,
  WeatherSnapshot,
} from '../../models';
import { addHours, islandDateKey, islandHour, TIME } from '../../utils/time';
import { msg } from '../../i18n/i18n.model';
import { DataSourceError } from '../data-sources';
import { AirQualityDto, ForecastDto, MarineDto } from './open-meteo.dto';

/*
 * Pure mapping from Open-Meteo responses to the app's contracts. Nothing here
 * fills a gap with a guess: an hour with a missing essential value is dropped,
 * an optional value stays null, and too little data is an error or "no
 * coverage", never a made-up number.
 */

/**
 * Surface Saharan dust (CAMS, µg/m³) from which the sky reads as calima.
 * Background air over Lanzarote carries 10–40 µg/m³; dust intrusions that
 * whiten the sky run from about 100 to well over 500. Orientative threshold.
 */
export const CALIMA_DUST_UGM3 = 100;

/**
 * Hours of forecast handed to the interface, from the current hour on: the
 * whole week asked for, so any of its seven days can be shown hour by hour.
 */
const HOURLY_STEPS = 7 * 24;
const DAYS = 7;

const toIso = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString();
/**
 * Sunrise and sunset come to the second (08:00:52) but are shown to the
 * minute. Rounded to the nearest one, as almanacs do, they are never more
 * than 30 s off; "hh:mm" alone would cut the seconds and show 08:00.
 */
const toIsoMinute = (unixSeconds: number) =>
  new Date(Math.round(unixSeconds / 60) * 60_000).toISOString();
const round1 = (value: number) => Math.round(value * 10) / 10;
const round2 = (value: number) => Math.round(value * 100) / 100;

function allPresent(values: readonly (number | null | undefined)[]): values is number[] {
  return values.every((v) => typeof v === 'number' && Number.isFinite(v));
}

/** Hours of a series from the hour containing `now` onwards. */
function fromCurrentHour<T extends { time: string }>(items: readonly T[], now: Date): T[] {
  const hourStart = Math.floor(now.getTime() / TIME.HOUR) * TIME.HOUR;
  return items.filter((item) => Date.parse(item.time) >= hourStart).slice(0, HOURLY_STEPS);
}

// ── Sky ──────────────────────────────────────────────────────────────

/**
 * WMO code (Open-Meteo subset) + total cloud cover + dust → the app's sky.
 * Any precipitation code counts as rain; fog reads as an overcast sky.
 */
export function skyFor(weatherCode: number, cloudCover: number, dust: number | null): SkyCondition {
  if (weatherCode >= 51) return 'lluvia';
  if (dust !== null && dust >= CALIMA_DUST_UGM3) return 'calima';
  if (weatherCode === 45 || weatherCode === 48) return 'cubierto';
  if (cloudCover < 0.15) return 'despejado';
  if (cloudCover < 0.42) return 'poco-nuboso';
  if (cloudCover < 0.75) return 'nuboso';
  return 'cubierto';
}

/**
 * How hard it rains for a WMO code (Open-Meteo subset), 0–1; undefined when
 * the code is not precipitation. Drizzle, rain and showers each come in three
 * strengths; thunderstorms count as the heaviest.
 */
export function rainIntensityFor(weatherCode: number): number | undefined {
  const byCode: Readonly<Record<number, number>> = {
    51: 0.15,
    53: 0.25,
    55: 0.35,
    56: 0.25,
    57: 0.35,
    61: 0.35,
    63: 0.6,
    65: 0.9,
    66: 0.45,
    67: 0.8,
    71: 0.3,
    73: 0.5,
    75: 0.8,
    77: 0.3,
    80: 0.45,
    81: 0.7,
    82: 1,
    85: 0.5,
    86: 0.8,
    95: 0.9,
    96: 1,
    99: 1,
  };
  return weatherCode >= 51 ? (byCode[weatherCode] ?? 0.6) : undefined;
}

const SEVERITY: readonly SkyCondition[] = [
  'lluvia',
  'calima',
  'cubierto',
  'nuboso',
  'poco-nuboso',
  'despejado',
];

/** A condition that lasts a third of the daylight names the day, worst first. */
function daySky(hours: readonly WeatherSnapshot[]): SkyCondition | null {
  if (hours.length === 0) return null;
  const daytime = hours.filter((h) => h.isDaylight);
  const pool = daytime.length > 0 ? daytime : hours;
  const counts = new Map<SkyCondition, number>();
  pool.forEach((h) => counts.set(h.sky, (counts.get(h.sky) ?? 0) + 1));
  const named = SEVERITY.find((c) => (counts.get(c) ?? 0) >= Math.max(3, pool.length / 3));
  if (named) return named;
  const afternoon = [...pool].sort(
    (a, b) =>
      Math.abs(islandHour(new Date(a.time)) - 15) - Math.abs(islandHour(new Date(b.time)) - 15),
  )[0];
  return afternoon.sky;
}

// ── Weather ──────────────────────────────────────────────────────────

/** Dust by hour (unix seconds) for one place; empty when unknown. */
export function dustByHour(dto: AirQualityDto | null | undefined): ReadonlyMap<number, number> {
  const byHour = new Map<number, number>();
  if (!dto) return byHour;
  dto.hourly.time.forEach((t, i) => {
    const value = dto.hourly.dust[i];
    if (typeof value === 'number') byHour.set(t, value);
  });
  return byHour;
}

function dustAt(dust: ReadonlyMap<number, number>, unixSeconds: number): number | null {
  const hour = Math.floor(unixSeconds / 3600) * 3600;
  return dust.get(hour) ?? null;
}

function hourlySnapshots(dto: ForecastDto, dust: ReadonlyMap<number, number>): WeatherSnapshot[] {
  const h = dto.hourly;
  const snapshots: WeatherSnapshot[] = [];
  h.time.forEach((t, i) => {
    const values = [
      h.temperature_2m[i],
      h.apparent_temperature[i],
      h.weather_code[i],
      h.cloud_cover[i],
      h.precipitation_probability[i],
      h.uv_index[i],
      h.wind_speed_10m[i],
      h.wind_direction_10m[i],
      h.wind_gusts_10m[i],
      h.is_day[i],
    ];
    if (!allPresent(values)) return;
    const [temp, feels, code, cloud, rainChance, uv, speed, direction, gust, isDay] = values;
    snapshots.push({
      time: toIso(t),
      temperatureC: round1(temp),
      feelsLikeC: round1(feels),
      sky: skyFor(code, cloud / 100, dustAt(dust, t)),
      cloudCover: round2(cloud / 100),
      precipitationChance: round2(rainChance / 100),
      rainIntensity: rainIntensityFor(code),
      uvIndex: Math.round(uv),
      wind: { speedKmh: Math.round(speed), gustKmh: Math.round(gust), fromDegrees: direction },
      isDaylight: isDay === 1,
    });
  });
  return snapshots;
}

function currentSnapshot(
  dto: ForecastDto,
  dust: ReadonlyMap<number, number>,
  hourly: readonly WeatherSnapshot[],
  now: Date,
): WeatherSnapshot | null {
  const c = dto.current;
  const sameHour = hourly.find(
    (h) => Math.floor(Date.parse(h.time) / TIME.HOUR) === Math.floor(now.getTime() / TIME.HOUR),
  );
  const values = [
    c.temperature_2m,
    c.apparent_temperature,
    c.weather_code,
    c.cloud_cover,
    c.uv_index,
    c.wind_speed_10m,
    c.wind_direction_10m,
    c.wind_gusts_10m,
    c.is_day,
  ];
  // The current block is the model's 15-minute step for now; if it has a gap,
  // the same model's value for this hour describes the same moment.
  if (!allPresent(values)) return sameHour ?? null;
  const [temp, feels, code, cloud, uv, speed, direction, gust, isDay] = values;
  return {
    time: toIso(c.time),
    temperatureC: round1(temp),
    feelsLikeC: round1(feels),
    sky: skyFor(code, cloud / 100, dustAt(dust, c.time)),
    cloudCover: round2(cloud / 100),
    // Open-Meteo has no "current" rain probability; the hour's value is the one.
    precipitationChance: sameHour?.precipitationChance ?? 0,
    rainIntensity: rainIntensityFor(code),
    uvIndex: Math.round(uv),
    wind: { speedKmh: Math.round(speed), gustKmh: Math.round(gust), fromDegrees: direction },
    isDaylight: isDay === 1,
  };
}

function dailyForecasts(dto: ForecastDto, hourly: readonly WeatherSnapshot[]): DailyForecast[] {
  const d = dto.daily;
  const days: DailyForecast[] = [];
  d.time.forEach((t, i) => {
    const values = [
      d.temperature_2m_max[i],
      d.temperature_2m_min[i],
      d.uv_index_max[i],
      d.precipitation_probability_max[i],
      d.wind_speed_10m_max[i],
      d.wind_direction_10m_dominant[i],
    ];
    if (!allPresent(values)) return;
    const [max, min, uv, rainChance, wind, windFrom] = values;
    // Sun times are optional: a day without them still has its weather.
    const sunrise = d.sunrise[i];
    const sunset = d.sunset[i];
    // `t` is local midnight; noon is safely inside the same island day.
    const date = islandDateKey(addHours(new Date(t * 1000), 12));
    const dayHours = hourly.filter((h) => islandDateKey(new Date(h.time)) === date);
    const sky = daySky(dayHours);
    if (!sky) return;
    // The provider's daily mean; failing that, the average of the day's hours we hold.
    const mean = d.wind_speed_10m_mean?.[i];
    const meanWind =
      typeof mean === 'number'
        ? mean
        : dayHours.reduce((sum, h) => sum + h.wind.speedKmh, 0) / Math.max(1, dayHours.length);
    days.push({
      date,
      minC: Math.round(min),
      maxC: Math.round(max),
      sky,
      precipitationChance: round2(rainChance / 100),
      maxWindKmh: Math.round(wind),
      meanWindKmh: Math.round(Math.min(meanWind, wind)),
      windFromDegrees: windFrom,
      uvMax: Math.round(uv),
      sunrise: typeof sunrise === 'number' ? toIsoMinute(sunrise) : null,
      sunset: typeof sunset === 'number' ? toIsoMinute(sunset) : null,
    });
  });
  return days;
}

export function toWeatherForecast(
  locationId: LocationId,
  dto: ForecastDto,
  dust: AirQualityDto | null,
  now: Date,
  retrievedAt: Date,
): WeatherForecast {
  const dustMap = dustByHour(dust);
  const all = hourlySnapshots(dto, dustMap);
  const hourly = fromCurrentHour(all, now);
  const current = currentSnapshot(dto, dustMap, all, now);
  const today = islandDateKey(now);
  const daily = dailyForecasts(dto, all)
    .filter((day) => day.date >= today)
    .slice(0, DAYS);

  if (!current || hourly.length < 24 || daily[0]?.date !== today) {
    throw new DataSourceError(msg('error.incomplete'));
  }
  return { locationId, issuedAt: retrievedAt.toISOString(), current, hourly, daily };
}

// ── Sea ──────────────────────────────────────────────────────────────

function seaSnapshots(dto: MarineDto): SeaSnapshot[] {
  const h = dto.hourly;
  const snapshots: SeaSnapshot[] = [];
  h.time.forEach((t, i) => {
    const waves = [h.wave_height[i], h.wave_period[i], h.wave_direction[i]];
    if (!allPresent(waves)) return;
    const swellValues = [h.swell_wave_height[i], h.swell_wave_period[i], h.swell_wave_direction[i]];
    const swell: WaveComponent | null = allPresent(swellValues)
      ? {
          heightM: round2(swellValues[0]),
          periodS: round1(swellValues[1]),
          fromDegrees: swellValues[2],
        }
      : null;
    const water = h.sea_surface_temperature[i];
    snapshots.push({
      time: toIso(t),
      waveHeightM: round2(waves[0]),
      wavePeriodS: round1(waves[1]),
      waveFromDegrees: waves[2],
      swell,
      waterTemperatureC: typeof water === 'number' ? round1(water) : null,
    });
  });
  return snapshots;
}

/** Null when the marine model has nothing for this point (no coverage). */
export function toSeaForecast(
  locationId: LocationId,
  dto: MarineDto,
  now: Date,
  retrievedAt: Date,
): SeaForecast | null {
  const hourly = fromCurrentHour(seaSnapshots(dto), now);
  const current = hourly[0];
  if (!current || hourly.length < 24) return null;
  return {
    locationId,
    issuedAt: retrievedAt.toISOString(),
    // The cell the model actually answered for, which can differ slightly from the one asked.
    point: { latitude: dto.latitude, longitude: dto.longitude } satisfies GeoPoint,
    current,
    hourly,
  };
}

// ── Tide ─────────────────────────────────────────────────────────────

/** Extremes closer than this in height are ripples, not tides. */
const MIN_TIDE_RANGE_M = 0.1;
const FIVE_MINUTES = 5 * TIME.MINUTE;

/**
 * Highs and lows of an hourly sea-level series. A parabola through each
 * turning point and its neighbours places the extreme between the hours.
 */
export function findTideExtremes(series: readonly TidePoint[]): TideExtreme[] {
  const found: TideExtreme[] = [];
  for (let i = 1; i < series.length - 1; i++) {
    const a = series[i - 1].heightM;
    const b = series[i].heightM;
    const c = series[i + 1].heightM;
    const isHigh = b >= a && b > c;
    const isLow = b <= a && b < c;
    if (!isHigh && !isLow) continue;
    const step = Date.parse(series[i + 1].time) - Date.parse(series[i].time);
    const curvature = a - 2 * b + c;
    const offset = curvature === 0 ? 0 : (0.5 * (a - c)) / curvature;
    const at = Date.parse(series[i].time) + offset * step;
    found.push({
      kind: isHigh ? 'pleamar' : 'bajamar',
      time: new Date(Math.round(at / FIVE_MINUTES) * FIVE_MINUTES).toISOString(),
      heightM: round2(b - 0.25 * (a - c) * offset),
    });
  }
  // Keep a clean high–low alternation, dropping ripples.
  const clean: TideExtreme[] = [];
  for (const extreme of found) {
    const last = clean[clean.length - 1];
    if (!last) {
      clean.push(extreme);
    } else if (last.kind === extreme.kind) {
      const better =
        extreme.kind === 'pleamar'
          ? extreme.heightM > last.heightM
          : extreme.heightM < last.heightM;
      if (better) clean[clean.length - 1] = extreme;
    } else if (Math.abs(last.heightM - extreme.heightM) < MIN_TIDE_RANGE_M) {
      clean.pop();
    } else {
      clean.push(extreme);
    }
  }
  return clean;
}

export const MODEL_TIDE_SOURCE = {
  kind: 'model',
  name: 'Météo-France SMOC (Open-Meteo)',
  official: false,
} as const;

/**
 * Tide estimate from the ocean model's sea level. Heights are relative to
 * mean sea level. Null when the series is too short to read a tide from.
 */
export function toTideForecast(locationId: LocationId, dto: MarineDto): TideForecast | null {
  const series: TidePoint[] = [];
  dto.hourly.time.forEach((t, i) => {
    const level = dto.hourly.sea_level_height_msl[i];
    if (typeof level === 'number') series.push({ time: toIso(t), heightM: round2(level) });
  });
  const extremes = findTideExtremes(series);
  if (extremes.length < 4) return null;
  return {
    locationId,
    source: MODEL_TIDE_SOURCE,
    datum: 'mean-sea-level',
    extremes,
    series,
  };
}
