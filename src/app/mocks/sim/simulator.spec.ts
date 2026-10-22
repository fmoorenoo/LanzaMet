import { buildRecommendations } from '../../core/insights/recommendations.insight';
import { ZoneConditions } from '../../core/models';
import { LOCATIONS_SEED } from '../seed/locations.seed';
import { simulateSea, simulateTides, simulateWeather } from './simulator';

const now = new Date('2026-10-22T10:30:00Z');
const byId = (id: string) => {
  const location = LOCATIONS_SEED.find((l) => l.id === id);
  if (!location) throw new Error(id);
  return location;
};

describe('simulator', () => {
  it('is deterministic for the same place, scenario and moment', () => {
    const input = { location: byId('famara'), scenario: 'alisio' as const, now };
    expect(simulateWeather(input)).toEqual(simulateWeather(input));
  });

  it('shelters the south from the north-easterly trade wind', () => {
    const south = simulateWeather({ location: byId('puerto-del-carmen'), scenario: 'alisio', now });
    const north = simulateWeather({ location: byId('famara'), scenario: 'alisio', now });
    expect(north.current.wind.speedKmh).toBeGreaterThan(south.current.wind.speedKmh + 8);

    const southSea = simulateSea({ location: byId('puerto-del-carmen'), scenario: 'alisio', now });
    const northSea = simulateSea({ location: byId('famara'), scenario: 'alisio', now });
    expect(northSea?.current.waveHeightM).toBeGreaterThan(southSea?.current.waveHeightM ?? 0);
  });

  it('produces 30 hourly steps and 7 days', () => {
    const forecast = simulateWeather({ location: byId('arrecife'), scenario: 'alisio', now });
    expect(forecast.hourly.length).toBe(30);
    expect(forecast.daily.length).toBe(7);
    expect(forecast.daily[0].date).toBe('2026-10-22');
  });

  it('respects missing coverage', () => {
    expect(simulateSea({ location: byId('el-golfo'), scenario: 'alisio', now })).toBeNull();
    expect(simulateTides({ location: byId('la-santa'), scenario: 'alisio', now })).toBeNull();
  });

  it('alternates highs and lows about six hours apart', () => {
    const tides = simulateTides({ location: byId('arrecife'), scenario: 'alisio', now });
    const extremes = tides?.extremes ?? [];
    expect(extremes.length).toBeGreaterThan(6);
    for (let i = 1; i < extremes.length; i++) {
      expect(extremes[i].kind).not.toBe(extremes[i - 1].kind);
      const gapH = (Date.parse(extremes[i].time) - Date.parse(extremes[i - 1].time)) / 3_600_000;
      expect(gapH).toBeCloseTo(6.21, 1);
    }
  });
});

describe('recommendations', () => {
  it('suggests a beach and a place out of the wind on a trade-wind day', () => {
    const zones: ZoneConditions[] = LOCATIONS_SEED.map((location) => ({
      location,
      weather: simulateWeather({ location, scenario: 'alisio', now }),
      sea: simulateSea({ location, scenario: 'alisio', now }),
    }));
    const kinds = buildRecommendations(zones, now).map((r) => r.kind);
    expect(kinds).toContain('playa');
    expect(kinds).toContain('resguardo');
  });

  it('has nothing to suggest without data', () => {
    expect(buildRecommendations([], now)).toEqual([]);
  });
});
