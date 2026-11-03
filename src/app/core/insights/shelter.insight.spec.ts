import { simulateSea, simulateWeather } from '../../mocks/sim/simulator';
import { LOCATIONS } from '../data/locations';
import { ZoneConditions } from '../models';
import { byShelter, islandWindFrom, roughness, windSituations } from './shelter.insight';

const now = new Date('2026-10-22T12:00:00Z');

/** A place with the wind and waves given, over a simulated day. */
function zone(
  id: string,
  speedKmh: number,
  fromDegrees: number,
  waveHeightM = 0.5,
): ZoneConditions {
  const location = LOCATIONS.find((l) => l.id === id);
  if (!location) throw new Error(id);
  const weather = simulateWeather({ location, scenario: 'alisio', now });
  const sea = simulateSea({ location, scenario: 'alisio', now });
  return {
    location,
    weather: {
      ...weather,
      current: { ...weather.current, wind: { speedKmh, gustKmh: speedKmh + 8, fromDegrees } },
    },
    sea: sea && { ...sea, current: { ...sea.current, waveHeightM } },
  };
}

describe('where to go when it blows', () => {
  it('reads a north-easterly as the trade wind', () => {
    const zones = [zone('famara', 30, 30), zone('playa-blanca', 12, 50), zone('arrecife', 25, 20)];
    expect([...windSituations(zones)]).toEqual(['alisio']);
  });

  it('reads a southerly or an easterly as the other side', () => {
    expect([...windSituations([zone('arrecife', 25, 170), zone('famara', 10, 150)])]).toEqual([
      'sur',
    ]);
    expect([...windSituations([zone('costa-teguise', 28, 95)])]).toEqual(['sur']);
  });

  it('weights each place by its speed, so a sheltered breeze does not turn the island', () => {
    // Strong trade wind on the open coast, a light southerly eddy in the south.
    const from = islandWindFrom([zone('famara', 35, 25), zone('puerto-del-carmen', 6, 190)]);
    expect(from).not.toBeNull();
    expect(from! < 45 || from! > 337.5).toBe(true);
  });

  it('calls a calm day calm, whatever the direction', () => {
    const zones = [zone('famara', 10, 200), zone('playa-blanca', 6, 40)];
    expect([...windSituations(zones)]).toEqual(['calma']);
  });

  it('adds the swell when the northern coasts have big waves', () => {
    const zones = [zone('famara', 20, 30, 2.6), zone('playa-blanca', 10, 40, 0.4)];
    expect(windSituations(zones).has('mar-de-fondo')).toBe(true);
    expect(windSituations(zones).has('alisio')).toBe(true);
  });

  it('ignores big waves on a coast the northern swell does not reach', () => {
    const zones = [zone('puerto-del-carmen', 20, 30, 2)];
    expect(windSituations(zones).has('mar-de-fondo')).toBe(false);
  });

  it('names no kind of day for a westerly', () => {
    expect(windSituations([zone('el-golfo', 30, 270)]).size).toBe(0);
  });

  it('orders the places from the most sheltered, by the worse of wind and sea', () => {
    const zones = [
      zone('famara', 32, 30, 2.2),
      zone('playa-blanca', 14, 40, 0.4),
      zone('costa-teguise', 24, 30, 0.6),
      // Little wind, but big waves: rougher than Costa Teguise's moderate wind.
      zone('la-santa', 10, 30, 1.8),
    ];
    expect(byShelter(zones).map((z) => z.location.id)).toEqual([
      'playa-blanca',
      'costa-teguise',
      'la-santa',
      'famara',
    ]);
    expect(roughness(zones[0])).toBe(3);
  });
});
