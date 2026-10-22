import { DailyForecast } from '../models';
import { readWind } from './wind.insight';

/** A day in a few words: "Sol y viento fuerte". */
export function dayPhrase(day: DailyForecast): string {
  const wind = readWind({
    speedKmh: day.maxWindKmh,
    gustKmh: day.maxWindKmh,
    fromDegrees: day.windFromDegrees,
  });
  switch (day.sky) {
    case 'lluvia':
      return 'Chubascos';
    case 'calima':
      return day.maxC >= 30 ? 'Calima y calor' : 'Calima';
    case 'cubierto':
      return 'Cubierto';
    case 'nuboso':
      return wind.level >= 3 ? 'Nubes y viento' : 'Nubes y claros';
    default:
      if (wind.level >= 3) return 'Sol y viento fuerte';
      if (wind.level === 2) return 'Sol y algo de viento';
      return day.sky === 'despejado' ? 'Sol y brisa' : 'Sol entre nubes';
  }
}

/** What changes compared with the day before, if anything worth saying. */
export function dayChange(previous: DailyForecast | undefined, day: DailyForecast): string | null {
  if (!previous) return null;
  if (day.sky === 'lluvia' && previous.sky !== 'lluvia') return 'Llega la lluvia';
  if (day.sky === 'calima' && previous.sky !== 'calima') return 'Llega la calima';
  if (previous.sky === 'calima' && day.sky !== 'calima') return 'Se va la calima';
  if (previous.sky === 'lluvia' && day.sky !== 'lluvia') return 'Vuelve el sol';
  if (day.maxWindKmh - previous.maxWindKmh >= 8) return 'Más viento';
  if (previous.maxWindKmh - day.maxWindKmh >= 8) return 'Amaina el viento';
  if (day.maxC - previous.maxC >= 3) return 'Más calor';
  if (previous.maxC - day.maxC >= 3) return 'Refresca';
  return null;
}
