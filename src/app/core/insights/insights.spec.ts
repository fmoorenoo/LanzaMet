import { TideForecast, WeatherSnapshot } from '../models';
import { describeWaves, readSea } from './sea.insight';
import { readTide } from './tide.insight';
import { beachScore, dayVerdict } from './verdict.insight';
import { readWind, toCardinal } from './wind.insight';
import { LOCATIONS_SEED } from '../../mocks/seed/locations.seed';

const sunnyCalm: WeatherSnapshot = {
  time: '2026-10-22T13:00:00.000Z',
  temperatureC: 25,
  feelsLikeC: 26,
  sky: 'despejado',
  cloudCover: 0.05,
  precipitationChance: 0,
  uvIndex: 7,
  wind: { speedKmh: 12, gustKmh: 18, fromDegrees: 30 },
  isDaylight: true,
};

const tide: TideForecast = {
  locationId: 'arrecife',
  source: { kind: 'station', stationName: 'Puerto de Arrecife' },
  extremes: [
    { kind: 'pleamar', time: '2026-10-22T10:20:00.000Z', heightM: 2.4 },
    { kind: 'bajamar', time: '2026-10-22T16:40:00.000Z', heightM: 0.3 },
    { kind: 'pleamar', time: '2026-10-22T22:50:00.000Z', heightM: 2.3 },
  ],
  series: [],
};

describe('wind', () => {
  it('names the direction it blows from', () => {
    expect(toCardinal(30)).toBe('NE');
    expect(toCardinal(350)).toBe('N');
    expect(toCardinal(225)).toBe('SO');
  });

  it('reads speed as words people use', () => {
    expect(readWind({ speedKmh: 12, gustKmh: 18, fromDegrees: 30 }).label).toBe('Brisa suave');
    expect(readWind({ speedKmh: 38, gustKmh: 50, fromDegrees: 30 }).label).toBe('Viento fuerte');
    expect(readWind({ speedKmh: 22, gustKmh: 30, fromDegrees: 30 }).isTradeWind).toBe(true);
  });
});

describe('sea', () => {
  it('describes waves in centimetres and metres', () => {
    expect(describeWaves(0.42)).toBe('Olas de unos 40 cm');
    expect(describeWaves(1.6)).toBe('Olas de 1,5 m');
  });

  it('labels the state of the sea', () => {
    const sea = {
      time: '',
      waveHeightM: 0.2,
      wavePeriodS: 7,
      swellFromDegrees: 330,
      waterTemperatureC: 22.4,
    };
    expect(readSea(sea).label).toBe('Mar como un plato');
    expect(readSea(sea).water).toBe('Agua a 22 °C');
  });
});

describe('tide', () => {
  it('knows the tide is falling between a high and a low', () => {
    const reading = readTide(tide, new Date('2026-10-22T13:30:00Z'));
    expect(reading?.trend).toBe('bajando');
    expect(reading?.headline).toBe('La marea está bajando');
    expect(reading?.nextLabel).toBe('Bajamar a las 17:40');
    expect(reading?.untilNext).toBe('3 h 10 min');
  });

  it('calls a high tide when it is close to it', () => {
    expect(readTide(tide, new Date('2026-10-22T10:35:00Z'))?.headline).toBe('Marea alta ahora');
  });

  it('returns null outside the predicted range', () => {
    expect(readTide(tide, new Date('2026-10-23T10:00:00Z'))).toBeNull();
  });
});

describe('verdict', () => {
  const puertoDelCarmen = LOCATIONS_SEED[0];

  it('invites to the beach on a sunny, calm day', () => {
    const verdict = dayVerdict({
      location: puertoDelCarmen,
      weather: sunnyCalm,
      upcoming: [sunnyCalm, sunnyCalm],
      sea: {
        time: '',
        waveHeightM: 0.3,
        wavePeriodS: 7,
        swellFromDegrees: 330,
        waterTemperatureC: 22,
      },
      dayWord: 'Hoy',
    });
    expect(verdict.headline).toBe('Hoy apetece playa');
    expect(verdict.sentence).toBe('Sol y brisa suave en Puerto del Carmen.');
  });

  it('warns when the wind is picking up', () => {
    const windy = { ...sunnyCalm, wind: { speedKmh: 32, gustKmh: 44, fromDegrees: 30 } };
    const verdict = dayVerdict({
      location: puertoDelCarmen,
      weather: sunnyCalm,
      upcoming: [sunnyCalm, windy, windy],
      sea: null,
      dayWord: 'Hoy',
    });
    expect(verdict.headline).toBe('El viento se está levantando');
  });

  it('scores no beach at night', () => {
    expect(beachScore({ ...sunnyCalm, isDaylight: false }, null)).toBe(0);
  });
});
