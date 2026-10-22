import { LOCATIONS } from '../data/locations';
import { StationObservation } from '../models';
import { representativeObservation } from './observation.insight';

const now = new Date('2026-10-22T15:30:00Z');

/** AEMET's stations on Lanzarote as OpenData described them on 2026-10-22. */
const station = (
  stationId: string,
  stationName: string,
  latitude: number,
  longitude: number,
  altitudeM: number,
): StationObservation => ({
  stationId,
  stationName,
  position: { latitude, longitude },
  altitudeM,
  time: '2026-10-22T15:00:00.000Z',
  temperatureC: 24,
  windKmh: 10,
  gustKmh: 18,
  windFromDegrees: 20,
  humidity: 70,
  precipitationMm: 0,
});

const STATIONS = [
  station('C018J', 'Tias-Las Vegas', 28.969726, -13.690277, 376),
  station('C019V', 'Yaiza-Playa Blanca', 28.858884, -13.834999, 6),
  station('C029O', 'Lanzarote/Aeropuerto', 28.951943, -13.600279, 14),
  station('C029R', 'Arrecife - Granja Cabildo', 29.001111, -13.558055, 107.58),
  station('C038N', 'Haría-Cementerio', 29.143611, -13.489167, 277),
  station('C048W', 'Tinajo-Los Dolores', 29.0425, -13.680833, 275),
  station('C839X', 'Teguise La Graciosa-Helipuerto', 29.229585, -13.51021, 19),
];

const pick = (id: string, observations = STATIONS) => {
  const place = LOCATIONS.find((l) => l.id === id);
  if (!place) throw new Error(id);
  return representativeObservation(place.position, observations, now)?.stationId ?? null;
};

describe('representative observation', () => {
  it('uses the closest low, nearby station for each coastal place', () => {
    expect(pick('puerto-del-carmen')).toBe('C029O');
    expect(pick('arrecife')).toBe('C029R');
    expect(pick('costa-teguise')).toBe('C029R');
    expect(pick('playa-blanca')).toBe('C019V');
    expect(pick('papagayo')).toBe('C019V');
    expect(pick('orzola')).toBe('C839X');
  });

  it('says nothing rather than borrowing a station from the hills or the far side', () => {
    // Haría (277 m) sits behind the Risco; Tinajo is 275 m up; the rest are over 10 km away.
    expect(pick('famara')).toBeNull();
    expect(pick('la-santa')).toBeNull();
    expect(pick('el-golfo')).toBeNull();
  });

  it('ignores readings more than three hours old', () => {
    const stale = STATIONS.map((s) => ({ ...s, time: '2026-10-22T11:00:00.000Z' }));
    expect(pick('playa-blanca', stale)).toBeNull();
  });

  it('ignores stations of unknown height', () => {
    const unknown = STATIONS.map((s) => ({ ...s, altitudeM: null }));
    expect(pick('playa-blanca', unknown)).toBeNull();
  });
});
