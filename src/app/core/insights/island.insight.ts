import { msg, Msg } from '../i18n/i18n.model';
import { IslandArea, ZoneConditions } from '../models';
import { readSea } from './sea.insight';
import { skyPhrase } from './sky.insight';
import { readWind } from './wind.insight';

/** The one thing worth knowing about a place right now, in two or three words. */
export function zoneHeadline(zone: ZoneConditions): Msg {
  const now = zone.weather.current;
  const wind = readWind(now.wind);
  const sea = zone.sea ? readSea(zone.sea.current) : null;
  if (now.sky === 'lluvia' || now.sky === 'calima') return skyPhrase(now.sky, now.isDaylight);
  if (wind.level >= 2) return wind.label;
  if (sea && sea.level >= 3) return sea.label;
  if (!now.isDaylight) return skyPhrase(now.sky, false);
  return msg(wind.level === 0 ? 'zone.skyCalm' : 'zone.skyBreeze', {
    sky: skyPhrase(now.sky, true),
  });
}

const NORTHERN: readonly IslandArea[] = ['norte', 'oeste'];

function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

/** One line that compares the island's coasts: where it blows, where it doesn't. */
export function islandSummary(zones: readonly ZoneConditions[]): Msg | null {
  if (zones.length === 0) return null;
  const north = zones.filter((z) => NORTHERN.includes(z.location.area));
  const south = zones.filter((z) => !NORTHERN.includes(z.location.area));

  const wind = (list: readonly ZoneConditions[]) =>
    average(list.map((z) => z.weather.current.wind.speedKmh));
  const waves = (list: readonly ZoneConditions[]) =>
    average(list.filter((z) => z.sea).map((z) => z.sea?.current.waveHeightM ?? 0));

  const maxWind = Math.max(...zones.map((z) => z.weather.current.wind.speedKmh));
  const maxWaves = Math.max(0, ...zones.map((z) => z.sea?.current.waveHeightM ?? 0));

  if (zones.some((z) => z.weather.current.sky === 'lluvia')) {
    return msg('island.rain');
  }
  if (zones.filter((z) => z.weather.current.sky === 'calima').length > zones.length / 2) {
    return msg('island.calima');
  }
  if (maxWind <= 15 && maxWaves <= 0.8) return msg('island.calm');

  const windGap = wind(north) - wind(south);
  if (windGap >= 6) {
    return msg(waves(north) >= 1.2 ? 'island.northWindWaves' : 'island.northWind');
  }
  if (windGap <= -6) return msg('island.southWind');
  return msg('island.similar');
}
