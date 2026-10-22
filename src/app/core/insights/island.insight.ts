import { IslandArea, ZoneConditions } from '../models';
import { readSea } from './sea.insight';
import { skyPhrase } from './sky.insight';
import { readWind } from './wind.insight';

/** The one thing worth knowing about a place right now, in two or three words. */
export function zoneHeadline(zone: ZoneConditions): string {
  const now = zone.weather.current;
  const wind = readWind(now.wind);
  const sea = zone.sea ? readSea(zone.sea.current) : null;
  if (now.sky === 'lluvia' || now.sky === 'calima') return skyPhrase(now.sky, now.isDaylight);
  if (wind.level >= 2) return wind.label;
  if (sea && sea.level >= 3) return sea.label;
  if (!now.isDaylight) return skyPhrase(now.sky, false);
  return wind.level === 0
    ? `${skyPhrase(now.sky, true)} y calma`
    : `${skyPhrase(now.sky, true)} y brisa`;
}

const NORTHERN: readonly IslandArea[] = ['norte', 'oeste'];

function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

/** One line that compares the island's coasts: where it blows, where it doesn't. */
export function islandSummary(zones: readonly ZoneConditions[]): string {
  if (zones.length === 0) return '';
  const north = zones.filter((z) => NORTHERN.includes(z.location.area));
  const south = zones.filter((z) => !NORTHERN.includes(z.location.area));

  const wind = (list: readonly ZoneConditions[]) =>
    average(list.map((z) => z.weather.current.wind.speedKmh));
  const waves = (list: readonly ZoneConditions[]) =>
    average(list.filter((z) => z.sea).map((z) => z.sea?.current.waveHeightM ?? 0));

  const maxWind = Math.max(...zones.map((z) => z.weather.current.wind.speedKmh));
  const maxWaves = Math.max(0, ...zones.map((z) => z.sea?.current.waveHeightM ?? 0));

  if (zones.some((z) => z.weather.current.sky === 'lluvia')) {
    return 'Chubascos repartidos por la isla. Busca los claros.';
  }
  if (zones.filter((z) => z.weather.current.sky === 'calima').length > zones.length / 2) {
    return 'Calima en toda la isla: cielo blanquecino y aire seco.';
  }
  if (maxWind <= 15 && maxWaves <= 0.8) return 'Calma en toda la isla.';

  const windGap = wind(north) - wind(south);
  if (windGap >= 6) {
    return waves(north) >= 1.2
      ? 'Viento y olas en el norte. El sur, resguardado.'
      : 'Más viento en el norte. El sur, resguardado.';
  }
  if (windGap <= -6) return 'Esta vez el viento entra por el sur. El norte, más tranquilo.';
  return 'Condiciones parecidas en toda la isla.';
}
