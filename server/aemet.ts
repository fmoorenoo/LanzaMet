/*
 * Pure readers for AEMET's public formats. No I/O here, so every function
 * can be tested against the real files kept in `fixtures/`.
 *
 *  · Warnings: the "estado completo" tar.gz linked from the Canarias RSS
 *    (CAP 1.2 XML files, one per warning, Plan Meteoalerta). No key needed.
 *  · Observations: AEMET OpenData conventional stations (needs an API key).
 */

/** Shape the web app expects (src/app/core/models/official.model.ts). */
export interface WeatherWarning {
  readonly id: string;
  readonly level: 'amarillo' | 'naranja' | 'rojo';
  readonly phenomenon: string;
  readonly coastal: boolean;
  readonly area: string;
  readonly onset: string;
  readonly expires: string;
  readonly description: string;
  readonly url: string;
}

export interface StationObservation {
  readonly stationId: string;
  readonly stationName: string;
  readonly position: { readonly latitude: number; readonly longitude: number };
  readonly altitudeM: number | null;
  readonly time: string;
  readonly temperatureC: number | null;
  readonly windKmh: number | null;
  readonly gustKmh: number | null;
  readonly windFromDegrees: number | null;
  readonly humidity: number | null;
  readonly precipitationMm: number | null;
}

/** Meteoalerta zones of Lanzarote: the island (659101) and its coastal waters (659101C). */
export const LANZAROTE_ZONES: readonly string[] = ['659101', '659101C'];

const LEVELS = new Set(['amarillo', 'naranja', 'rojo']);

// ── Small XML helpers (CAP and RSS are simple, flat and machine-written) ──

const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, code: string) => {
      if (code.startsWith('#x') || code.startsWith('#X')) {
        return String.fromCodePoint(parseInt(code.slice(2), 16));
      }
      if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
      return ENTITIES[code] ?? whole;
    })
    .trim();
}

function blocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'g');
  return [...xml.matchAll(re)].map((m) => m[1]);
}

function text(xml: string, tag: string): string | null {
  const found = blocks(xml, tag)[0];
  return found === undefined ? null : decodeXml(found);
}

/** `<parameter><valueName>name</valueName><value>v</value></parameter>` pairs. */
function namedValue(xml: string, container: string, name: string): string | null {
  for (const block of blocks(xml, container)) {
    if (text(block, 'valueName') === name) return text(block, 'value');
  }
  return null;
}

// ── RSS ──────────────────────────────────────────────────────────────

/** Link to the archive with every active CAP file, from an AEMET warnings RSS. */
export function fullStateArchiveUrl(rss: string): string | null {
  for (const item of blocks(rss, 'item')) {
    const link = text(item, 'link');
    if (link?.endsWith('.tar.gz')) return link;
  }
  return null;
}

export function rssPublishedAt(rss: string): string | null {
  const date = text(rss, 'lastBuildDate') ?? text(rss, 'pubDate');
  const parsed = date ? Date.parse(date) : NaN;
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

// ── tar ──────────────────────────────────────────────────────────────

export interface ArchiveFile {
  readonly name: string;
  readonly content: Uint8Array;
}

/** Regular files of a POSIX/ustar archive. */
export function untar(bytes: Uint8Array): ArchiveFile[] {
  const files: ArchiveFile[] = [];
  const ascii = new TextDecoder('ascii');
  let offset = 0;
  while (offset + 512 <= bytes.length) {
    const header = bytes.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const field = (start: number, length: number) =>
      ascii
        .decode(header.subarray(start, start + length))
        .replace(/\0.*$/s, '')
        .trim();
    const name = field(0, 100);
    const size = parseInt(field(124, 12) || '0', 8);
    const type = field(156, 1);
    const prefix = field(345, 155);
    const start = offset + 512;
    if (type === '0' || type === '') {
      files.push({
        name: prefix ? `${prefix}/${name}` : name,
        content: bytes.subarray(start, start + size),
      });
    }
    offset = start + Math.ceil(size / 512) * 512;
  }
  return files;
}

export async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// ── CAP ──────────────────────────────────────────────────────────────

/**
 * Warnings of a CAP message that apply to `zones` and are still in force at
 * `now`. Green ("no warning") levels, cancellations and other languages are
 * left out.
 */
export function warningsFromCap(
  xml: string,
  zones: readonly string[],
  now: Date,
): WeatherWarning[] {
  const identifier = text(xml, 'identifier') ?? 'aviso';
  const status = text(xml, 'status');
  const msgType = text(xml, 'msgType');
  if (status !== 'Actual' || msgType === 'Cancel') return [];

  const warnings: WeatherWarning[] = [];
  for (const info of blocks(xml, 'info')) {
    if (text(info, 'language') !== 'es-ES') continue;
    const level = namedValue(info, 'parameter', 'AEMET-Meteoalerta nivel');
    if (!level || !LEVELS.has(level)) continue;
    const onset = text(info, 'onset') ?? text(info, 'effective');
    const expires = text(info, 'expires');
    if (!onset || !expires || Date.parse(expires) <= now.getTime()) continue;
    const phenomenonCode = namedValue(info, 'eventCode', 'AEMET-Meteoalerta fenomeno');
    const phenomenon = phenomenonCode?.split(';')[1] ?? text(info, 'event') ?? 'Aviso';

    for (const area of blocks(info, 'area')) {
      const zone = namedValue(area, 'geocode', 'AEMET-Meteoalerta zona');
      if (!zone || !zones.includes(zone)) continue;
      warnings.push({
        id: `${identifier}-${zone}`,
        level: level as WeatherWarning['level'],
        phenomenon,
        coastal: zone.endsWith('C'),
        area: text(area, 'areaDesc') ?? zone,
        onset: new Date(onset).toISOString(),
        expires: new Date(expires).toISOString(),
        description: text(info, 'description') ?? text(info, 'headline') ?? '',
        url: text(info, 'web') ?? 'https://www.aemet.es/es/eltiempo/prediccion/avisos',
      });
    }
  }
  return warnings;
}

/** Every applicable warning in an archive, one per phenomenon, zone and start time. */
export function warningsFromArchive(
  files: readonly ArchiveFile[],
  zones: readonly string[],
  now: Date,
): WeatherWarning[] {
  const decoder = new TextDecoder('utf-8');
  const unique = new Map<string, WeatherWarning>();
  for (const file of files) {
    if (!file.name.endsWith('.xml')) continue;
    for (const warning of warningsFromCap(decoder.decode(file.content), zones, now)) {
      unique.set(`${warning.phenomenon}|${warning.area}|${warning.onset}`, warning);
    }
  }
  return [...unique.values()];
}

// ── OpenData observations ────────────────────────────────────────────

/**
 * AEMET's conventional stations on Lanzarote and La Graciosa, as listed by
 * OpenData on 2026-10-22 (all reporting hourly). Asked one by one: OpenData
 * takes a single station per request, and the national list ("todas", 3.4 MB)
 * costs ~270 ms of CPU to parse against ~0.3 ms per station.
 */
export const LANZAROTE_STATIONS: readonly string[] = [
  'C018J', // Tías - Las Vegas
  'C019V', // Yaiza - Playa Blanca
  'C029O', // Lanzarote / Aeropuerto
  'C029R', // Arrecife - Granja Cabildo
  'C038N', // Haría - Cementerio
  'C048W', // Tinajo - Los Dolores
  'C839X', // Teguise La Graciosa - Helipuerto
];

/** "2026-10-22T14:00:00+0000" (as AEMET writes it) or no zone at all → a valid UTC instant. */
function parseUtc(fint: string): Date {
  const iso = fint.replace(/([+-]\d\d)(\d\d)$/, '$1:$2');
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

/** Lanzarote and La Graciosa, with a margin that keeps Fuerteventura out. */
const ISLAND_BOX = { south: 28.82, north: 29.3, west: -13.95, east: -13.38 };

const KMH_PER_MS = 3.6;

/** AEMET OpenData serves its data files in ISO-8859-15; Latin-1 decodes every name we need. */
export function decodeLatin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return out;
}

const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/**
 * Latest reading of each station on the island, from OpenData
 * "observacion/convencional" records. Times are UTC ("fint").
 */
export function islandObservations(records: unknown): StationObservation[] {
  if (!Array.isArray(records)) return [];
  const latest = new Map<string, StationObservation>();
  for (const r of records as Record<string, unknown>[]) {
    const lat = num(r['lat']);
    const lon = num(r['lon']);
    const id = typeof r['idema'] === 'string' ? r['idema'] : null;
    const fint = typeof r['fint'] === 'string' ? r['fint'] : null;
    if (lat === null || lon === null || !id || !fint) continue;
    if (lat < ISLAND_BOX.south || lat > ISLAND_BOX.north) continue;
    if (lon < ISLAND_BOX.west || lon > ISLAND_BOX.east) continue;
    const time = parseUtc(fint);
    if (Number.isNaN(time.getTime())) continue;
    const previous = latest.get(id);
    if (previous && Date.parse(previous.time) >= time.getTime()) continue;
    const speed = num(r['vv']);
    const gust = num(r['vmax']);
    latest.set(id, {
      stationId: id,
      stationName: typeof r['ubi'] === 'string' ? titleCase(r['ubi']) : id,
      position: { latitude: lat, longitude: lon },
      altitudeM: num(r['alt']),
      time: time.toISOString(),
      temperatureC: num(r['ta']),
      windKmh: speed === null ? null : Math.round(speed * KMH_PER_MS),
      gustKmh: gust === null ? null : Math.round(gust * KMH_PER_MS),
      windFromDegrees: num(r['dv']),
      humidity: num(r['hr']),
      precipitationMm: num(r['prec']),
    });
  }
  return [...latest.values()];
}

/** "LANZAROTE AEROPUERTO" → "Lanzarote Aeropuerto" */
function titleCase(name: string): string {
  return name
    .toLocaleLowerCase('es-ES')
    .replace(
      /(^|[\s/(-])(\p{L})/gu,
      (_, sep: string, letter: string) => sep + letter.toLocaleUpperCase('es-ES'),
    );
}
