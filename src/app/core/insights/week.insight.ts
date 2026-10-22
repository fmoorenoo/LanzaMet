import { msg, Msg } from '../i18n/i18n.model';
import { DailyForecast } from '../models';
import { readWind } from './wind.insight';

/** A day in a few words: "Sol y viento fuerte". */
export function dayPhrase(day: DailyForecast): Msg {
  const wind = readWind({
    speedKmh: day.maxWindKmh,
    gustKmh: day.maxWindKmh,
    fromDegrees: day.windFromDegrees,
  });
  switch (day.sky) {
    case 'lluvia':
      return msg('week.rain');
    case 'calima':
      return msg(day.maxC >= 30 ? 'week.calimaHeat' : 'week.calima');
    case 'cubierto':
      return msg('week.overcast');
    case 'nuboso':
      return msg(wind.level >= 3 ? 'week.cloudWind' : 'week.cloudSun');
    default:
      if (wind.level >= 3) return msg('week.sunStrongWind');
      if (wind.level === 2) return msg('week.sunSomeWind');
      return msg(day.sky === 'despejado' ? 'week.sunBreeze' : 'week.sunClouds');
  }
}

/** What changes compared with the day before, if anything worth saying. */
export function dayChange(previous: DailyForecast | undefined, day: DailyForecast): Msg | null {
  if (!previous) return null;
  if (day.sky === 'lluvia' && previous.sky !== 'lluvia') return msg('week.change.rainArrives');
  if (day.sky === 'calima' && previous.sky !== 'calima') return msg('week.change.calimaArrives');
  if (previous.sky === 'calima' && day.sky !== 'calima') return msg('week.change.calimaLeaves');
  if (previous.sky === 'lluvia' && day.sky !== 'lluvia') return msg('week.change.sunReturns');
  if (day.maxWindKmh - previous.maxWindKmh >= 8) return msg('week.change.moreWind');
  if (previous.maxWindKmh - day.maxWindKmh >= 8) return msg('week.change.lessWind');
  if (day.maxC - previous.maxC >= 3) return msg('week.change.warmer');
  if (previous.maxC - day.maxC >= 3) return msg('week.change.cooler');
  return null;
}
