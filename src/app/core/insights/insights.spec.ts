import { Lang, MessageKey, Msg } from '../i18n/i18n.model';
import { translate } from '../i18n/translate';
import { TideForecast } from '../models';
import { describeSwell, describeWaves, readSea } from './sea.insight';
import { readTide, tideHeight } from './tide.insight';
import { readWind, toCardinal } from './wind.insight';

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
    expect(es(readWind({ speedKmh: 12, gustKmh: 18, fromDegrees: 30 }).label)).toBe('Brisa suave');
    expect(es(readWind({ speedKmh: 38, gustKmh: 50, fromDegrees: 30 }).label)).toBe(
      'Viento fuerte',
    );
    expect(readWind({ speedKmh: 22, gustKmh: 30, fromDegrees: 30 }).isTradeWind).toBe(true);
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
