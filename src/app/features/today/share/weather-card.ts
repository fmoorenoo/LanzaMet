import { msg, Msg } from '../../../core/i18n/i18n.model';
import { SeaReading } from '../../../core/insights/sea.insight';
import { TideReading } from '../../../core/insights/tide.insight';
import { Verdict } from '../../../core/insights/verdict.insight';
import { WindReading } from '../../../core/insights/wind.insight';
import { IsoDate, SkyCondition } from '../../../core/models';
import { formatTime, islandDateKey } from '../../../core/utils/time';
import { SceneState } from '../../../shared/scene/scene-state';

/**
 * What a shared card shows: exactly what the Today page is showing for the
 * chosen place and moment, never more. Readings the page has no data for
 * (sea, tide) are null and left off the card.
 */
export interface WeatherCard {
  readonly place: string;
  /** The moment described: now, or the hour chosen in the forecast. */
  readonly at: Date;
  readonly isNow: boolean;
  /** The island's date today, to tell "today" from "tomorrow". */
  readonly today: IsoDate;
  readonly scene: SceneState;
  readonly temperature: number;
  readonly feelsLike: number;
  readonly range: { readonly max: number; readonly min: number };
  readonly sky: SkyCondition;
  readonly isDaylight: boolean;
  readonly verdict: Verdict;
  readonly wind: WindReading;
  readonly sea: SeaReading | null;
  readonly tide: { readonly reading: TideReading; readonly estimated: boolean } | null;
}

const SKY_EMOJI: Readonly<Record<SkyCondition, readonly [day: string, night: string]>> = {
  despejado: ['☀️', '🌙'],
  'poco-nuboso': ['🌤️', '🌙'],
  nuboso: ['⛅', '☁️'],
  cubierto: ['☁️', '☁️'],
  calima: ['🌫️', '🌫️'],
  lluvia: ['🌧️', '🌧️'],
};

/** The sky in an emoji, then the sea, or the wind when it is what stands out. */
export function cardEmoji(card: Pick<WeatherCard, 'sky' | 'isDaylight' | 'wind'>): string {
  const sky = SKY_EMOJI[card.sky][card.isDaylight ? 0 : 1];
  return sky + (card.wind.level >= 3 ? '💨' : '🌊');
}

/** "hoy a las 18:00" / "mañana a las 09:00", for a moment that is not now. */
function laterWhen(card: Pick<WeatherCard, 'at' | 'today'>): Msg {
  const key = islandDateKey(card.at) === card.today ? 'share.when.today' : 'share.when.tomorrow';
  return msg(key, { time: { time: card.at } });
}

/**
 * The words that travel with the picture: one natural sentence naming the
 * place (and the hour, when it is a forecast rather than now), then the
 * link when there is one to give.
 */
export function shareMessage(
  card: Pick<WeatherCard, 'place' | 'isNow' | 'at' | 'today' | 'sky' | 'isDaylight' | 'wind'>,
  link: string | null,
): Msg {
  const emoji = cardEmoji(card);
  const text = card.isNow
    ? msg('share.text.now', { place: card.place, emoji })
    : msg('share.text.later', { place: card.place, when: laterWhen(card), emoji });
  return link ? msg('share.text.link', { text, url: link }) : text;
}

/** A description of the picture for whoever cannot see it. */
export function cardAlt(card: WeatherCard): Msg {
  return msg('share.card.alt', {
    place: card.place,
    when: card.isNow ? msg('share.when.now') : laterWhen(card),
    temp: card.temperature,
    headline: card.verdict.headline,
  });
}

/** "que-tal-hoy-famara-1800.png" */
export function cardFileName(card: Pick<WeatherCard, 'place' | 'at'>): string {
  const place = card.place
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `que-tal-hoy-${place || 'lanzarote'}-${formatTime(card.at).replace(':', '')}.png`;
}
