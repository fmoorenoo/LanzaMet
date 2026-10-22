/*
 * Live check of every data source the app uses, for every place.
 *   npm run verify:sources
 * Asks the real APIs with the same parameters as the app and checks shapes,
 * units, time zone, coverage and the sea points. Exits non-zero on failure.
 * (Coordinates mirror src/app/core/data/locations.ts.)
 */
import {
  fullStateArchiveUrl,
  gunzip,
  LANZAROTE_ZONES,
  untar,
  warningsFromArchive,
} from '../server/aemet.ts';

const PLACES = [
  { id: 'puerto-del-carmen', at: [28.921, -13.668], sea: [28.875, -13.625] },
  { id: 'arrecife', at: [28.9625, -13.5477], sea: [28.875, -13.541667] },
  { id: 'playa-blanca', at: [28.8628, -13.8296], sea: [28.875, -13.791667] },
  { id: 'costa-teguise', at: [29.0005, -13.4905], sea: [28.958333, -13.375] },
  { id: 'famara', at: [29.1155, -13.5565], sea: [29.208333, -13.708333] },
  { id: 'orzola', at: [29.2228, -13.4497], sea: [29.291667, -13.458333] },
  { id: 'la-santa', at: [29.1117, -13.6545], sea: [29.208333, -13.708333] },
  { id: 'el-golfo', at: [28.979, -13.832], sea: [28.958333, -13.875] },
  { id: 'papagayo', at: [28.8455, -13.787], sea: [28.875, -13.791667] },
] as const;

const COMMON = 'timezone=Atlantic%2FCanary&timeformat=unixtime';
const coords = (points: readonly (readonly [number, number])[]) =>
  `latitude=${points.map((p) => p[0].toFixed(4)).join(',')}&longitude=${points.map((p) => p[1].toFixed(4)).join(',')}`;

let failures = 0;
function check(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.log(`  ✗ ${message}`);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return (await response.json()) as T;
}

type Series = (number | null)[];
interface Forecast {
  latitude: number;
  longitude: number;
  timezone: string;
  current: Record<string, number | null>;
  hourly: Record<string, Series> & { time: number[] };
  daily: Record<string, Series> & { time: number[] };
}
interface Marine {
  latitude: number;
  longitude: number;
  hourly: Record<string, Series> & { time: number[] };
}

const localTime = (unix: number) =>
  new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Atlantic/Canary',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(unix * 1000);

const forecastUrl = `https://api.open-meteo.com/v1/forecast?${coords(PLACES.map((p) => p.at))}&current=temperature_2m,apparent_temperature,is_day,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,apparent_temperature,weather_code,cloud_cover,precipitation_probability,uv_index,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&${COMMON}&forecast_days=7`;
const seaPoints = [...new Map(PLACES.map((p) => [p.sea.join(), p.sea])).values()];
const marineUrl = `https://marine-api.open-meteo.com/v1/marine?${coords(seaPoints)}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_surface_temperature,sea_level_height_msl&${COMMON}&past_days=1&forecast_days=3`;
const dustUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${coords(PLACES.map((p) => p.at))}&hourly=dust&domains=cams_global&${COMMON}&forecast_days=5`;

const [forecasts, marine, dust] = await Promise.all([
  getJson<Forecast[]>(forecastUrl),
  getJson<Marine[]>(marineUrl),
  getJson<{ hourly: { dust: Series } }[]>(dustUrl),
]);

console.log(
  `Open-Meteo: ${forecasts.length} previsiones, ${marine.length} puntos de mar, ${dust.length} series de polvo\n`,
);
check(forecasts.length === PLACES.length, 'una previsión por zona');
check(marine.length === seaPoints.length, 'un punto de mar por celda distinta');

const now = Date.now() / 1000;
for (const [i, place] of PLACES.entries()) {
  const f = forecasts[i];
  const sea = marine[seaPoints.findIndex((p) => p.join() === place.sea.join())];
  const c = f.current;
  console.log(
    `${place.id.padEnd(18)} celda ${f.latitude.toFixed(3)},${f.longitude.toFixed(3)}  ` +
      `${c['temperature_2m']} °C  viento ${c['wind_speed_10m']} km/h de ${c['wind_direction_10m']}°  ` +
      `nubes ${c['cloud_cover']} %  wmo ${c['weather_code']}  ` +
      `polvo ${dust[i].hourly.dust.find((v) => v !== null)} µg/m³`,
  );
  check(f.timezone === 'Atlantic/Canary', `${place.id}: zona horaria`);
  check(f.daily.time.length === 7, `${place.id}: 7 días`);
  check(
    Object.entries(f.hourly).every(([, v]) => v.slice(0, 48).every((x) => x !== null)),
    `${place.id}: 48 h sin huecos`,
  );
  const t = c['temperature_2m'] ?? NaN;
  check(t > 5 && t < 45, `${place.id}: temperatura en °C plausible`);
  const sunrise = localTime(f.daily['sunrise'][0] ?? 0);
  check(/^0[78]:/.test(sunrise), `${place.id}: amanecer ${sunrise} en hora canaria`);

  const hour = sea.hourly.time.findIndex((x) => x >= now - 3600);
  const own =
    Math.abs(sea.latitude - place.sea[0]) < 0.005 && Math.abs(sea.longitude - place.sea[1]) < 0.005;
  check(own, `${place.id}: el punto de mar es una celda de mar propia`);
  const hs = sea.hourly['wave_height'][hour];
  console.log(
    `${''.padEnd(18)} mar ${sea.latitude.toFixed(3)},${sea.longitude.toFixed(3)}  ` +
      `olas ${hs} m de ${sea.hourly['wave_direction'][hour]}°  ` +
      `fondo ${sea.hourly['swell_wave_height'][hour]} m ${sea.hourly['swell_wave_period'][hour]} s  ` +
      `agua ${sea.hourly['sea_surface_temperature'][hour]} °C  nivel ${sea.hourly['sea_level_height_msl'][hour]} m`,
  );
  check(hs !== null && hs >= 0 && hs < 15, `${place.id}: altura de ola en metros`);
  const sst = sea.hourly['sea_surface_temperature'][hour];
  check(sst !== null && sst > 15 && sst < 30, `${place.id}: temperatura del agua plausible`);
  check(
    sea.hourly['sea_level_height_msl'].filter((v) => v !== null).length >= 48,
    `${place.id}: serie de nivel del mar para la marea`,
  );
}

console.log('\nAEMET avisos (RSS + CAP de Canarias)');
const rss = await (
  await fetch('https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAC65_RSS.xml')
).text();
const archiveUrl = fullStateArchiveUrl(rss);
check(archiveUrl !== null, 'el RSS enlaza el estado completo');
if (archiveUrl) {
  const bytes = new Uint8Array(await (await fetch(archiveUrl)).arrayBuffer());
  const files = untar(await gunzip(bytes));
  const warnings = warningsFromArchive(files, LANZAROTE_ZONES, new Date());
  console.log(
    `  ${files.length} ficheros CAP; avisos amarillo o superior para Lanzarote: ${warnings.length}`,
  );
  warnings.forEach((w) =>
    console.log(`  · ${w.level} ${w.phenomenon} (${w.area}) hasta ${w.expires}`),
  );
  check(files.length > 0, 'el paquete de avisos contiene ficheros CAP');
}

console.log(
  failures === 0
    ? '\n✓ Todas las fuentes responden como se espera'
    : `\n✗ ${failures} comprobaciones fallidas`,
);
process.exitCode = failures === 0 ? 0 : 1;
