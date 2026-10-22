import { TidePoint } from '../../models';
import { formatTime, islandDateKey, TIME } from '../../utils/time';
import { DataSourceError } from '../data-sources';
import dustFixture from './fixtures/dust-arrecife.json';
import forecastFixture from './fixtures/forecast-arrecife.json';
import marineFixture from './fixtures/marine-arrecife.json';
import { AirQualityDto, ForecastDto, MarineDto } from './open-meteo.dto';
import {
  CALIMA_DUST_UGM3,
  findTideExtremes,
  skyFor,
  toSeaForecast,
  toTideForecast,
  toWeatherForecast,
} from './open-meteo.mappers';

/*
 * Fixtures are real Open-Meteo responses for Arrecife (and its sea point),
 * captured on 2026-10-22 at 15:45 island time with the same parameters the
 * app sends. They pin down units, time zones and the DST change of 25 Oct.
 */
const forecast = forecastFixture as unknown as ForecastDto;
const dust = dustFixture as unknown as AirQualityDto;
const marine = marineFixture as unknown as MarineDto;

const now = new Date(forecast.current.time * 1000);
const retrievedAt = new Date('2026-10-22T14:46:00Z');

describe('Open-Meteo weather mapping', () => {
  const result = toWeatherForecast('arrecife', forecast, dust, now, retrievedAt);

  it('starts the hourly forecast at the current hour, one step per hour', () => {
    const hourStart = Math.floor(now.getTime() / TIME.HOUR) * TIME.HOUR;
    expect(Date.parse(result.hourly[0].time)).toBe(hourStart);
    expect(result.hourly.length).toBe(48);
    result.hourly.slice(1).forEach((h, i) => {
      expect(Date.parse(h.time) - Date.parse(result.hourly[i].time)).toBe(TIME.HOUR);
    });
  });

  it('gives seven island days starting today', () => {
    expect(result.daily.length).toBe(7);
    expect(result.daily[0].date).toBe(islandDateKey(now));
    expect(result.daily.map((d) => d.date)).toEqual([
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
    ]);
  });

  it('keeps sunrise in island time across the end of summer time', () => {
    // Clocks go back on Sunday 25 October: sunrise jumps from about 8:00 to about 7:00.
    expect(formatTime(result.daily[0].sunrise)).toMatch(/^07:5\d|^08:0\d/);
    expect(formatTime(result.daily[4].sunrise)).toMatch(/^07:0\d/);
    expect(formatTime(result.daily[0].sunset)).toMatch(/^19:1\d/);
  });

  it('normalises units: °C, whole km/h, 0–1 fractions, whole UV index', () => {
    for (const h of [result.current, ...result.hourly]) {
      expect(h.temperatureC).toBeGreaterThan(5);
      expect(h.temperatureC).toBeLessThan(45);
      expect(Number.isInteger(h.wind.speedKmh)).toBe(true);
      expect(h.wind.gustKmh).toBeGreaterThanOrEqual(h.wind.speedKmh);
      expect(h.cloudCover).toBeGreaterThanOrEqual(0);
      expect(h.cloudCover).toBeLessThanOrEqual(1);
      expect(h.precipitationChance).toBeLessThanOrEqual(1);
      expect(Number.isInteger(h.uvIndex)).toBe(true);
    }
    expect(result.current.temperatureC).toBe(forecast.current.temperature_2m);
    expect(result.current.wind.speedKmh).toBe(Math.round(forecast.current.wind_speed_10m ?? NaN));
  });

  it('records when the data was retrieved', () => {
    expect(result.issuedAt).toBe(retrievedAt.toISOString());
  });

  it('marks night hours from the provider, not from a guess', () => {
    const night = result.hourly.find((h) => formatTime(h.time) === '23:00');
    expect(night?.isDaylight).toBe(false);
  });

  it('turns heavy Saharan dust into calima, but rain wins', () => {
    const dusty: AirQualityDto = {
      ...dust,
      hourly: { ...dust.hourly, dust: dust.hourly.dust.map(() => CALIMA_DUST_UGM3 + 50) },
    };
    const hazy = toWeatherForecast('arrecife', forecast, dusty, now, retrievedAt);
    expect(hazy.current.sky === 'calima' || hazy.current.sky === 'lluvia').toBe(true);
  });

  it('still forecasts without dust data, just without calima', () => {
    const plain = toWeatherForecast('arrecife', forecast, null, now, retrievedAt);
    expect(plain.hourly.every((h) => h.sky !== 'calima')).toBe(true);
  });

  it('drops hours with gaps instead of inventing values', () => {
    const gappy: ForecastDto = {
      ...forecast,
      hourly: {
        ...forecast.hourly,
        temperature_2m: forecast.hourly.temperature_2m.map((t, i) => (i % 2 === 0 ? null : t)),
      },
    };
    const mapped = toWeatherForecast('arrecife', gappy, null, now, retrievedAt);
    const known = new Set(
      gappy.hourly.time
        .filter((_, i) => gappy.hourly.temperature_2m[i] !== null)
        .map((t) => t * 1000),
    );
    expect(mapped.hourly.length).toBeGreaterThanOrEqual(24);
    expect(mapped.hourly.every((h) => known.has(Date.parse(h.time)))).toBe(true);
  });

  it('uses the same hour of the model when the current block has a gap', () => {
    const noCurrent: ForecastDto = {
      ...forecast,
      current: { ...forecast.current, temperature_2m: null },
    };
    const mapped = toWeatherForecast('arrecife', noCurrent, null, now, retrievedAt);
    expect(mapped.current.time).toBe(mapped.hourly[0].time);
  });

  it('refuses a forecast that is too incomplete to show', () => {
    const empty: ForecastDto = {
      ...forecast,
      hourly: {
        ...forecast.hourly,
        wind_speed_10m: forecast.hourly.wind_speed_10m.map(() => null),
      },
    };
    expect(() => toWeatherForecast('arrecife', empty, null, now, retrievedAt)).toThrow(
      DataSourceError,
    );
  });
});

describe('sky', () => {
  it('reads the WMO code first, then dust, then cloud cover', () => {
    expect(skyFor(0, 0.05, null)).toBe('despejado');
    expect(skyFor(1, 0.3, 20)).toBe('poco-nuboso');
    expect(skyFor(2, 0.62, 20)).toBe('nuboso');
    expect(skyFor(3, 0.95, null)).toBe('cubierto');
    expect(skyFor(45, 0.2, null)).toBe('cubierto');
    expect(skyFor(61, 0.9, null)).toBe('lluvia');
    expect(skyFor(80, 0.6, 400)).toBe('lluvia');
    expect(skyFor(0, 0.05, CALIMA_DUST_UGM3)).toBe('calima');
    expect(skyFor(0, 0.05, CALIMA_DUST_UGM3 - 1)).toBe('despejado');
  });
});

describe('Open-Meteo sea mapping', () => {
  it('maps waves, swell and water from the current hour', () => {
    const sea = toSeaForecast('arrecife', marine, now, retrievedAt);
    expect(sea).not.toBeNull();
    if (!sea) return;
    expect(Date.parse(sea.current.time)).toBe(Math.floor(now.getTime() / TIME.HOUR) * TIME.HOUR);
    expect(sea.hourly.length).toBeGreaterThanOrEqual(24);
    expect(sea.current.waveHeightM).toBeGreaterThan(0);
    expect(sea.current.waveHeightM).toBeLessThan(10);
    expect(sea.current.swell?.periodS).toBeGreaterThan(0);
    expect(sea.current.waterTemperatureC).toBeGreaterThan(15);
    expect(sea.current.waterTemperatureC).toBeLessThan(30);
    // The cell the model actually answered for.
    expect(sea.point).toEqual({ latitude: marine.latitude, longitude: marine.longitude });
  });

  it('reports no coverage when the model has no waves there', () => {
    const dry: MarineDto = {
      ...marine,
      hourly: { ...marine.hourly, wave_height: marine.hourly.wave_height.map(() => null) },
    };
    expect(toSeaForecast('arrecife', dry, now, retrievedAt)).toBeNull();
  });

  it('keeps a missing water temperature missing', () => {
    const noWater: MarineDto = {
      ...marine,
      hourly: {
        ...marine.hourly,
        sea_surface_temperature: marine.hourly.sea_surface_temperature.map(() => null),
      },
    };
    expect(toSeaForecast('arrecife', noWater, now, retrievedAt)?.current.waterTemperatureC).toBe(
      null,
    );
  });
});

describe('tide estimate', () => {
  const tide = toTideForecast('arrecife', marine);

  it('is labelled as a model estimate around mean sea level, never official', () => {
    expect(tide?.source.official).toBe(false);
    expect(tide?.source.kind).toBe('model');
    expect(tide?.datum).toBe('mean-sea-level');
  });

  it('alternates highs and lows about six hours apart', () => {
    const extremes = tide?.extremes ?? [];
    expect(extremes.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < extremes.length; i++) {
      expect(extremes[i].kind).not.toBe(extremes[i - 1].kind);
      const gapH = (Date.parse(extremes[i].time) - Date.parse(extremes[i - 1].time)) / TIME.HOUR;
      expect(gapH).toBeGreaterThan(5);
      expect(gapH).toBeLessThan(7.5);
    }
    extremes.forEach((e) =>
      expect(e.kind === 'pleamar' ? e.heightM > 0 : e.heightM < 0).toBe(true),
    );
  });

  it('agrees within 45 minutes with an independent harmonic prediction for Arrecife', () => {
    // tide-forecast.com, 22 Oct 2026 (WEST): low 05:29, high 11:39, low 17:57.
    const reference = [
      { kind: 'bajamar', time: Date.parse('2026-10-22T04:29:00Z') },
      { kind: 'pleamar', time: Date.parse('2026-10-22T10:39:00Z') },
      { kind: 'bajamar', time: Date.parse('2026-10-22T16:57:00Z') },
    ];
    for (const ref of reference) {
      const match = (tide?.extremes ?? []).find(
        (e) => e.kind === ref.kind && Math.abs(Date.parse(e.time) - ref.time) < 3 * TIME.HOUR,
      );
      expect(match).toBeDefined();
      expect(Math.abs(Date.parse(match?.time ?? '') - ref.time)).toBeLessThan(45 * TIME.MINUTE);
    }
  });

  it('finds extremes between hourly samples', () => {
    // A 12.42 h tide with a high at 03:20 and a low at 09:32.
    const high = Date.parse('2026-10-22T03:20:00Z');
    const period = 12.42 * TIME.HOUR;
    const series: TidePoint[] = Array.from({ length: 30 }, (_, i) => {
      const t = Date.parse('2026-10-22T00:00:00Z') + i * TIME.HOUR;
      return {
        time: new Date(t).toISOString(),
        heightM: Math.cos(((t - high) / period) * 2 * Math.PI),
      };
    });
    const [first, second] = findTideExtremes(series);
    expect(first.kind).toBe('pleamar');
    expect(Math.abs(Date.parse(first.time) - high)).toBeLessThanOrEqual(10 * TIME.MINUTE);
    expect(second.kind).toBe('bajamar');
    expect(Math.abs(Date.parse(second.time) - (high + period / 2))).toBeLessThanOrEqual(
      10 * TIME.MINUTE,
    );
  });

  it('gives no tide when the series is too short', () => {
    const short: MarineDto = {
      ...marine,
      hourly: {
        ...marine.hourly,
        sea_level_height_msl: marine.hourly.sea_level_height_msl.map((v, i) => (i < 8 ? v : null)),
      },
    };
    expect(toTideForecast('arrecife', short)).toBeNull();
  });
});
