import { Lang, MessageKey, Msg } from '../i18n/i18n.model';
import { translate } from '../i18n/translate';
import { TideForecast } from '../models';
import { describeSwell, describeWaves, readSea, seaFacets, waterFeel } from './sea.insight';
import { readTide, tideHeight } from './tide.insight';
import { readWind, toCardinal, windHue, windShare, windSteps, windTint } from './wind.insight';

/** The rules return descriptors; read them in a language to check the words. */
const es = (text: Msg | MessageKey | null | undefined) => (text ? translate(text, 'es') : null);
const inLang = (lang: Lang, text: Msg | null | undefined) => (text ? translate(text, lang) : null);

const tide: TideForecast = {
  locationId: 'arrecife',
  source: { kind: 'station', name: 'Puerto de Arrecife', official: true },
  datum: 'chart',
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
    expect(es(readWind({ speedKmh: 12, gustKmh: 18, fromDegrees: 30 }).label)).toBe('Viento flojo');
    expect(es(readWind({ speedKmh: 12, gustKmh: 18, fromDegrees: 30 }).phrase)).toBe('brisa suave');
    expect(es(readWind({ speedKmh: 38, gustKmh: 50, fromDegrees: 30 }).label)).toBe(
      'Viento fuerte',
    );
    expect(readWind({ speedKmh: 22, gustKmh: 30, fromDegrees: 30 }).isTradeWind).toBe(true);
  });

  it('follows the Beaufort scale, grouped in five steps', () => {
    const level = (speedKmh: number) => readWind({ speedKmh, gustKmh: speedKmh, fromDegrees: 0 });
    // Edges of Beaufort 2, 4, 5 and 7 in km/h (WMO).
    expect([5, 6, 19, 20, 28, 29, 49, 50].map((s) => level(s).level)).toEqual([
      0, 1, 1, 2, 2, 3, 3, 4,
    ]);
    expect(['Calma', 'Flojo', 'Moderado', 'Fuerte', 'Muy fuerte']).toEqual(
      [3, 12, 24, 35, 60].map((s) => es(level(s).scale)),
    );
    expect(inLang('en', level(24).scale)).toBe('Moderate');
  });

  it('fills a gauge one step per level, by how far into the level the speed is', () => {
    expect(windSteps(0)).toBe(0);
    expect(windSteps(6)).toBe(1);
    expect(windSteps(13)).toBeCloseTo(1.5, 1);
    expect(windSteps(29)).toBe(3);
    expect(windSteps(200)).toBe(5);
    expect(windShare(30)).toBe(0.5);
    expect(windShare(90)).toBe(1);
  });

  it('colours the wind green, yellow, orange, red, then violet at the top', () => {
    expect(windHue(0)).toBe(150);
    expect(windHue(10)).toBeGreaterThan(130); // green
    expect(windHue(24)).toBeGreaterThan(60); // yellow-orange
    expect(windHue(24)).toBeLessThan(95);
    expect(windHue(45)).toBeLessThan(40); // red
    expect(windHue(120)).toBe(-55); // violet (305°)
    // Never lighter for more wind.
    const hues = [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60].map(windHue);
    expect(hues).toEqual([...hues].sort((a, b) => b - a));
  });

  it('keeps a calm almost white and colours it fully by a light breeze', () => {
    expect(windTint(0)).toBe(0.1);
    expect(windTint(4)).toBeGreaterThan(0.1);
    expect(windTint(4)).toBeLessThan(1);
    expect(windTint(9)).toBe(1);
    expect(windTint(40)).toBe(1);
  });
});

describe('sea', () => {
  it('describes waves in centimetres and metres', () => {
    expect(es(describeWaves(0.42))).toBe('Olas de unos 40 cm');
    expect(es(describeWaves(1.6))).toBe('Olas de 1,5 m');
  });

  it('labels the state of the sea', () => {
    const sea = {
      time: '',
      waveHeightM: 0.2,
      wavePeriodS: 7,
      waveFromDegrees: 330,
      swell: null,
      waterTemperatureC: 22.4,
    };
    expect(es(readSea(sea).label)).toBe('Mar como un plato');
    expect(es(readSea(sea).water)).toBe('Agua a 22 °C');
    expect(readSea({ ...sea, waterTemperatureC: null }).water).toBeNull();
  });

  it('names the swell with its direction, height and period', () => {
    expect(es(describeSwell({ heightM: 1.14, periodS: 11.2, fromDegrees: 340 }))).toBe(
      'Mar de fondo del norte, 1,1 m cada 11 s',
    );
    expect(describeSwell({ heightM: 0.1, periodS: 6, fromDegrees: 30 })).toBeNull();
    expect(describeSwell(null)).toBeNull();
  });

  it('takes the sea apart in words first, figures second', () => {
    const sea = {
      time: '',
      waveHeightM: 0.9,
      wavePeriodS: 6.4,
      waveFromDegrees: 30,
      swell: { heightM: 1.14, periodS: 12.3, fromDegrees: 340 },
      waterTemperatureC: 23.2,
    };
    const facets = seaFacets(sea);
    expect(es(facets.waves.title)).toBe('Olas de unos 90 cm');
    expect(es(facets.waves.detail)).toBe('Cada 6 s');
    expect(es(facets.swell.title)).toBe('Llega del norte');
    expect(es(facets.swell.detail)).toBe('Ondas largas, llegan de lejos · 1,1 m cada 12 s');
    expect(es(facets.water?.title)).toBe('Templada');
    expect(es(facets.water?.detail)).toBe('23 °C');
    expect(inLang('en', facets.swell.title)).toBe('Coming from the north');

    const flat = seaFacets({ ...sea, swell: null, waterTemperatureC: null });
    expect(es(flat.swell.title)).toBe('Apenas hay');
    expect(flat.swell.fromDegrees).toBeNull();
    expect(flat.water).toBeNull();
  });

  it('says how the water feels in bands, not to the decimal', () => {
    expect([18, 20, 22, 24].map((t) => es(waterFeel(t)))).toEqual([
      'Fría',
      'Fresca',
      'Agradable',
      'Templada',
    ]);
  });
});

describe('tide', () => {
  it('knows the tide is falling between a high and a low', () => {
    const reading = readTide(tide, new Date('2026-10-22T13:30:00Z'));
    expect(reading?.trend).toBe('bajando');
    expect(es(reading?.headline)).toBe('La marea está bajando');
    expect(es(reading?.nextLabel)).toBe('Bajamar a las 17:40');
    expect(es(reading && { key: 'common.value', params: { value: reading.untilNext } })).toBe(
      '3 h 10 min',
    );
  });

  it('calls a high tide when it is close to it', () => {
    expect(es(readTide(tide, new Date('2026-10-22T10:35:00Z'))?.headline)).toBe('Marea alta ahora');
  });

  it('never gives an estimate an exact-sounding time', () => {
    const estimate = {
      ...tide,
      source: { kind: 'model' as const, name: 'Modelo', official: false },
    };
    expect(es(readTide(estimate, new Date('2026-10-22T13:30:00Z'))?.nextLabel)).toBe(
      'Bajamar hacia las 17:40',
    );
  });

  it('signs heights around mean sea level', () => {
    expect(es(tideHeight(0.54, 'mean-sea-level'))).toBe('+0,5 m');
    expect(es(tideHeight(-1.12, 'mean-sea-level'))).toBe('−1,1 m');
    expect(es(tideHeight(2.4, 'chart'))).toBe('2,4 m');
    expect(inLang('en', tideHeight(0.54, 'mean-sea-level'))).toBe('+0.5 m');
  });

  it('returns null outside the predicted range', () => {
    expect(readTide(tide, new Date('2026-10-23T10:00:00Z'))).toBeNull();
  });
});
