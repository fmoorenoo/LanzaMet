import {
  DailyForecast,
  Location,
  SeaForecast,
  SeaSnapshot,
  SkyCondition,
  TideForecast,
  TideSource,
  WeatherForecast,
  WeatherSnapshot,
} from '../../core/models';
import { DIRECTION_DEGREES } from '../../core/insights/wind.insight';
import { angleBetween, clamp, hashString, lerp, seededRandom } from '../../core/utils/math';
import {
  addHours,
  islandDateKey,
  islandDayStart,
  islandHour,
  startOfIslandDay,
  TIME,
} from '../../core/utils/time';
import { CLIMATE_TRAITS, ClimateTraits } from '../seed/locations.seed';
import { ScenarioDay, ScenarioId, scenarioById } from './scenarios';
import { sunTimes } from './sun';
import { tideExtremes, tideSeries } from './tides';

/*
 * DEMO DATA — deterministic weather simulator.
 *
 * Same inputs, same outputs: every component that asks about a place at a
 * given moment gets the same answer, and a refresh doesn't reshuffle the sky.
 */

const HOURLY_STEPS = 30;
const DAYS = 7;
const UV_PEAK_BY_MONTH = [5, 6, 8, 9, 10, 11, 11, 11, 9, 7, 5, 4];
const WATER_C_BY_MONTH = [19, 18.5, 18.5, 19, 19.5, 20.5, 21.5, 22.5, 23, 22.5, 21.5, 20];

export interface SimulationInput {
  readonly location: Location;
  readonly scenario: ScenarioId;
  readonly now: Date;
}

interface Context {
  readonly location: Location;
  readonly traits: ClimateTraits;
  readonly days: readonly ScenarioDay[];
  readonly dayZero: Date;
}

const DEFAULT_TRAITS: ClimateTraits = {
  windFactor: 1,
  cloudiness: 0.1,
  temperatureOffsetC: 0,
  swellFactor: 1,
  tideDelayMin: 0,
  waterOffsetC: 0,
};

function contextFor(input: SimulationInput): Context {
  return {
    location: input.location,
    traits: CLIMATE_TRAITS[input.location.id] ?? DEFAULT_TRAITS,
    days: scenarioById(input.scenario).days,
    dayZero: startOfIslandDay(input.now),
  };
}

/** Scenario values are anchored at local noon and blended in between. */
function scenarioAt(ctx: Context, at: Date): ScenarioDay {
  const days = (at.getTime() - ctx.dayZero.getTime()) / (24 * TIME.HOUR) - 0.5;
  const last = ctx.days.length - 1;
  const i = clamp(Math.floor(days), 0, last);
  const j = clamp(i + 1, 0, last);
  const t = clamp(days - i);
  const a = ctx.days[i];
  const b = ctx.days[j];
  const windFrom = blendAngle(a.windFrom, b.windFrom, t);
  const swellFrom = blendAngle(a.swellFrom, b.swellFrom, t);
  return {
    maxC: lerp(a.maxC, b.maxC, t),
    rangeC: lerp(a.rangeC, b.rangeC, t),
    windKmh: lerp(a.windKmh, b.windKmh, t),
    windFrom,
    swellM: lerp(a.swellM, b.swellM, t),
    swellFrom,
    clouds: lerp(a.clouds, b.clouds, t),
    haze: lerp(a.haze, b.haze, t),
    rain: lerp(a.rain, b.rain, t),
  };
}

function blendAngle(a: number, b: number, t: number): number {
  const delta = ((((b - a) % 360) + 540) % 360) - 180;
  return (a + delta * t + 360) % 360;
}

/** 0 when the coast turns its back to `fromDegrees`, 1 when it faces it. */
function exposure(location: Location, fromDegrees: number): number {
  const facing = DIRECTION_DEGREES[location.facing];
  return (1 + Math.cos((angleBetween(fromDegrees, facing) * Math.PI) / 180)) / 2;
}

function noise(ctx: Context, at: Date, salt: string): number {
  const key = `${ctx.location.id}|${salt}|${Math.floor(at.getTime() / TIME.HOUR)}`;
  return seededRandom(hashString(key))() * 2 - 1;
}

interface DaylightInfo {
  readonly sunrise: Date;
  readonly sunset: Date;
}

function daylightFor(ctx: Context, at: Date): DaylightInfo {
  const noon = addHours(startOfIslandDay(at), 12);
  return sunTimes(noon, ctx.location.position);
}

function windAt(ctx: Context, s: ScenarioDay, at: Date) {
  const hour = islandHour(at);
  // Trade winds pick up through the afternoon and ease at night.
  const diurnal = 0.78 + 0.34 * Math.max(0, Math.cos(((hour - 15) / 12) * Math.PI));
  const shelter = lerp(0.4, 1.2, exposure(ctx.location, s.windFrom));
  const speed = Math.max(
    2,
    s.windKmh * diurnal * shelter * ctx.traits.windFactor * (1 + 0.08 * noise(ctx, at, 'w')),
  );
  return {
    speedKmh: Math.round(speed),
    gustKmh: Math.round(speed * (1.32 + 0.08 * noise(ctx, at, 'g'))),
    fromDegrees: Math.round((s.windFrom + 8 * noise(ctx, at, 'd') + 360) % 360),
  };
}

function skyFrom(clouds: number, haze: number, rain: number): SkyCondition {
  if (rain >= 0.45 && clouds >= 0.55) return 'lluvia';
  if (haze >= 0.45) return 'calima';
  if (clouds < 0.15) return 'despejado';
  if (clouds < 0.42) return 'poco-nuboso';
  if (clouds < 0.75) return 'nuboso';
  return 'cubierto';
}

function weatherAt(ctx: Context, at: Date): WeatherSnapshot {
  const s = scenarioAt(ctx, at);
  const hour = islandHour(at);
  const { sunrise, sunset } = daylightFor(ctx, at);
  const isDaylight = at >= sunrise && at < sunset;

  const wind = windAt(ctx, s, at);
  // Northerly flow piles cloud against the northern cliffs, mostly in the morning.
  const northFlow = Math.max(0, Math.cos((angleBetween(s.windFrom, 20) * Math.PI) / 180));
  const morning = 1 + 0.5 * Math.max(0, Math.cos(((hour - 8) / 10) * Math.PI));
  const cloudCover = clamp(
    s.clouds +
      ctx.traits.cloudiness * northFlow * morning * (s.windKmh / 25) +
      0.07 * noise(ctx, at, 'c'),
  );
  const sky = skyFrom(cloudCover, s.haze, s.rain);

  const mean = s.maxC - s.rangeC / 2 + ctx.traits.temperatureOffsetC;
  const temperature = mean + (s.rangeC / 2) * Math.cos(((hour - 15) / 24) * 2 * Math.PI);
  const sunWarmth = isDaylight && cloudCover < 0.4 ? 1.2 : 0;
  const windChill = Math.max(0, wind.speedKmh - 12) / 9;

  const dayLength = sunset.getTime() - sunrise.getTime();
  const solar = isDaylight
    ? Math.sin((Math.PI * (at.getTime() - sunrise.getTime())) / dayLength)
    : 0;
  const uvPeak = UV_PEAK_BY_MONTH[at.getUTCMonth()];
  const uv = uvPeak * Math.pow(solar, 1.5) * (1 - 0.55 * cloudCover) * (1 - 0.3 * s.haze);

  return {
    time: at.toISOString(),
    temperatureC: Math.round(temperature * 10) / 10,
    feelsLikeC: Math.round((temperature + sunWarmth - windChill) * 10) / 10,
    sky,
    cloudCover: Math.round(cloudCover * 100) / 100,
    precipitationChance: Math.round(clamp(s.rain * (0.6 + 0.5 * cloudCover)) * 100) / 100,
    uvIndex: Math.round(uv),
    wind,
    isDaylight,
  };
}

function dailyFor(ctx: Context, dayStart: Date): DailyForecast {
  const hours = Array.from({ length: 24 }, (_, h) => weatherAt(ctx, addHours(dayStart, h)));
  const daytime = hours.filter((h) => h.isDaylight);
  const temps = hours.map((h) => h.temperatureC);
  const afternoon = hours[15];
  const { sunrise, sunset } = daylightFor(ctx, addHours(dayStart, 12));
  const severity: SkyCondition[] = [
    'lluvia',
    'calima',
    'cubierto',
    'nuboso',
    'poco-nuboso',
    'despejado',
  ];
  const counts = new Map<SkyCondition, number>();
  daytime.forEach((h) => counts.set(h.sky, (counts.get(h.sky) ?? 0) + 1));
  // A condition that lasts a third of the day names the day, worst first.
  const sky =
    severity.find((c) => (counts.get(c) ?? 0) >= Math.max(3, daytime.length / 3)) ?? afternoon.sky;

  return {
    date: islandDateKey(addHours(dayStart, 12)),
    minC: Math.round(Math.min(...temps)),
    maxC: Math.round(Math.max(...temps)),
    sky,
    precipitationChance: Math.max(...hours.map((h) => h.precipitationChance)),
    maxWindKmh: Math.max(...hours.map((h) => h.wind.speedKmh)),
    windFromDegrees: afternoon.wind.fromDegrees,
    uvMax: Math.max(...hours.map((h) => h.uvIndex)),
    sunrise: sunrise.toISOString(),
    sunset: sunset.toISOString(),
  };
}

export function simulateWeather(input: SimulationInput): WeatherForecast {
  const ctx = contextFor(input);
  const currentHour = new Date(Math.floor(input.now.getTime() / TIME.HOUR) * TIME.HOUR);
  return {
    locationId: input.location.id,
    issuedAt: currentHour.toISOString(),
    current: weatherAt(ctx, input.now),
    hourly: Array.from({ length: HOURLY_STEPS }, (_, i) =>
      weatherAt(ctx, addHours(currentHour, i)),
    ),
    daily: Array.from({ length: DAYS }, (_, d) => dailyFor(ctx, islandDayStart(input.now, d))),
  };
}

function seaAt(ctx: Context, at: Date): SeaSnapshot {
  const s = scenarioAt(ctx, at);
  const wind = windAt(ctx, s, at);
  const swellExposure = Math.pow(
    Math.max(
      0,
      Math.cos((angleBetween(s.swellFrom, DIRECTION_DEGREES[ctx.location.facing]) * Math.PI) / 180),
    ),
    1.3,
  );
  const swell = s.swellM * (0.12 + 0.88 * swellExposure) * ctx.traits.swellFactor;
  const windSea = Math.pow(wind.speedKmh / 40, 2) * 0.6 * exposure(ctx.location, wind.fromDegrees);
  const height = (swell + windSea) * (1 + 0.06 * noise(ctx, at, 's'));
  const water = WATER_C_BY_MONTH[at.getUTCMonth()] + ctx.traits.waterOffsetC;
  const period = Math.round(6 + s.swellM * 2.2);
  const swellFrom = Math.round(s.swellFrom);

  return {
    time: at.toISOString(),
    waveHeightM: Math.round(height * 10) / 10,
    wavePeriodS: period,
    waveFromDegrees: swell >= windSea ? swellFrom : wind.fromDegrees,
    swell:
      swell >= 0.1
        ? { heightM: Math.round(swell * 10) / 10, periodS: period, fromDegrees: swellFrom }
        : null,
    waterTemperatureC: Math.round(water * 10) / 10,
  };
}

export function simulateSea(input: SimulationInput): SeaForecast | null {
  const point = input.location.coverage.sea;
  if (!point) return null;
  const ctx = contextFor(input);
  const currentHour = new Date(Math.floor(input.now.getTime() / TIME.HOUR) * TIME.HOUR);
  return {
    locationId: input.location.id,
    issuedAt: currentHour.toISOString(),
    point,
    current: seaAt(ctx, input.now),
    hourly: Array.from({ length: HOURLY_STEPS }, (_, i) => seaAt(ctx, addHours(currentHour, i))),
  };
}

export function simulateTides(input: SimulationInput): TideForecast | null {
  const coverage = input.location.coverage.tide;
  if (coverage.kind === 'none') return null;
  const source: TideSource =
    coverage.kind === 'model'
      ? { kind: 'model', name: 'Simulación', official: false }
      : { kind: coverage.kind, name: coverage.stationName, official: false };
  const ctx = contextFor(input);
  const from = ctx.dayZero.getTime();
  const delay = ctx.traits.tideDelayMin;
  return {
    locationId: input.location.id,
    source,
    datum: 'chart',
    extremes: tideExtremes(from - 7 * TIME.HOUR, from + 72 * TIME.HOUR, delay),
    series: tideSeries(from, from + 30 * TIME.HOUR, 15, delay),
  };
}
