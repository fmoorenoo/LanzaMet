import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  decodeLatin1,
  fullStateArchiveUrl,
  gunzip,
  islandObservations,
  LANZAROTE_ZONES,
  rssPublishedAt,
  untar,
  warningsFromArchive,
  warningsFromCap,
} from './aemet.ts';

/*
 * Fixtures are real AEMET files from 22 Oct 2026: the Canarias warnings RSS
 * and the "estado completo" archive it linked (20 CAP files; orange and
 * yellow rain in Gran Canaria, Tenerife, La Palma, La Gomera and El Hierro,
 * green everywhere else — nothing for Lanzarote).
 */
const fixture = (name: string) => new URL(`./fixtures/${name}`, import.meta.url);
const rss = readFileSync(fixture('canarias-rss-20261022.xml'), 'utf8');
const archive = new Uint8Array(readFileSync(fixture('canarias-20261022T003734Z.tar.gz')));
const duringRain = new Date('2026-10-22T02:00:00Z');

async function files() {
  return untar(await gunzip(archive));
}

describe('AEMET warnings RSS', () => {
  it('links the archive with every active warning', () => {
    assert.equal(
      fullStateArchiveUrl(rss),
      'https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/cap/Z_CAP_C_LEMM_20261022003734_AFAC65.tar.gz',
    );
    assert.equal(rssPublishedAt(rss), '2026-10-22T00:37:34.000Z');
  });
});

describe('AEMET CAP archive', () => {
  it('unpacks every CAP file', async () => {
    const list = await files();
    assert.equal(list.length, 20);
    assert.ok(list.every((f) => f.name.endsWith('.xml') && f.content.length > 500));
  });

  it('finds the orange rain warning for the north of Gran Canaria', async () => {
    const warnings = warningsFromArchive(await files(), ['659001'], duringRain);
    const rain = warnings.find((w) => w.level === 'naranja');
    assert.ok(rain);
    assert.equal(rain.phenomenon, 'Lluvias');
    assert.equal(rain.area, 'Norte de Gran Canaria');
    assert.equal(rain.coastal, false);
    assert.equal(rain.onset, '2026-10-22T00:00:00.000Z');
    assert.equal(rain.expires, '2026-10-22T04:59:59.000Z');
    assert.match(rain.description, /40 mm/);
  });

  it('reports nothing for Lanzarote that day: its CAP entries are all green', async () => {
    assert.deepEqual(warningsFromArchive(await files(), LANZAROTE_ZONES, duringRain), []);
  });

  it('drops warnings that have expired', async () => {
    const later = new Date('2026-10-22T06:00:00Z');
    const north = warningsFromArchive(await files(), ['659001'], later);
    assert.deepEqual(north, []);
  });

  it('reads a coastal warning for Lanzarote, keeping only the Spanish text', async () => {
    // A real island-wide coastal CAP (green; it lists "Costa - Lanzarote"), raised to yellow.
    const source = (await files()).find((f) => f.name.includes('COCO'));
    assert.ok(source);
    const xml = new TextDecoder()
      .decode(source.content)
      .replaceAll('<value>verde</value>', '<value>amarillo</value>');
    const warnings = warningsFromCap(xml, LANZAROTE_ZONES, duringRain);
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0].area, 'Costa - Lanzarote');
    assert.equal(warnings[0].coastal, true);
    assert.equal(warnings[0].phenomenon, 'Costeros');
    assert.equal(warnings[0].level, 'amarillo');
  });

  it('ignores cancellations', async () => {
    const source = (await files())[0];
    const original = new TextDecoder().decode(source.content);
    assert.notDeepEqual(warningsFromCap(original, ['659302'], duringRain), []);
    const cancelled = original.replace(/<msgType>\w+<\/msgType>/, '<msgType>Cancel</msgType>');
    assert.deepEqual(warningsFromCap(cancelled, ['659302'], duringRain), []);
  });
});

describe('AEMET OpenData observations (real response)', () => {
  // Lanzarote/Aeropuerto (C029O), 22 Oct 2026, as OpenData serves it: ISO-8859-15, "+0000" times.
  const records: unknown = JSON.parse(
    decodeLatin1(new Uint8Array(readFileSync(fixture('aemet-C029O-20261022.json')))),
  );

  it('reads the latest hour of the station in km/h and UTC', () => {
    assert.ok(Array.isArray(records) && records.length >= 12);
    const [airport] = islandObservations(records);
    assert.equal(airport.stationId, 'C029O');
    assert.equal(airport.stationName, 'Lanzarote/Aeropuerto');
    assert.equal(airport.altitudeM, 14);
    const latest = (records as { fint: string }[])
      .map((r) => r.fint)
      .sort()
      .at(-1);
    assert.equal(airport.time, new Date((latest ?? '').replace('+0000', 'Z')).toISOString());
    assert.ok(
      airport.temperatureC !== null && airport.temperatureC > 10 && airport.temperatureC < 40,
    );
    assert.ok(airport.windKmh !== null && Number.isInteger(airport.windKmh));
  });
});

describe('AEMET OpenData observations', () => {
  // Record shape as documented by AEMET OpenData ("observacion/convencional/todas").
  const record = (over: Record<string, unknown>) => ({
    idema: 'C029O',
    ubi: 'LANZAROTE AEROPUERTO',
    lat: 28.9519,
    lon: -13.6006,
    fint: '2026-10-22T13:00:00',
    ta: 25.1,
    vv: 5.6,
    vmax: 9.1,
    dv: 20,
    hr: 61,
    prec: 0,
    ...over,
  });

  it('keeps the latest reading of each station on the island, in km/h and UTC', () => {
    const result = islandObservations([
      record({}),
      record({ fint: '2026-10-22T14:00:00', ta: 25.6 }),
      record({ idema: 'C649I', ubi: 'GRAN CANARIA AEROPUERTO', lat: 27.92, lon: -15.39 }),
      record({ idema: 'C249I', ubi: 'FUERTEVENTURA AEROPUERTO', lat: 28.44, lon: -13.86 }),
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].stationName, 'Lanzarote Aeropuerto');
    assert.equal(result[0].time, '2026-10-22T14:00:00.000Z');
    assert.equal(result[0].temperatureC, 25.6);
    assert.equal(result[0].windKmh, 20);
    assert.equal(result[0].gustKmh, 33);
  });

  it('keeps missing sensors missing', () => {
    const [only] = islandObservations([record({ ta: undefined, vv: null })]);
    assert.equal(only.temperatureC, null);
    assert.equal(only.windKmh, null);
  });

  it('ignores anything that is not a list of records', () => {
    assert.deepEqual(islandObservations({ estado: 401 }), []);
  });
});
