import { toSeaForecast, toWeatherForecast } from '../core/data/http/open-meteo.mappers';
import { AirQualityDto, ForecastDto, MarineDto } from '../core/data/http/open-meteo.dto';
import { Lang, msg, Msg } from '../core/i18n/i18n.model';
import { zonePath } from '../core/i18n/localized-paths';
import { translate } from '../core/i18n/translate';
import { stepsFrom } from '../core/insights/moment.insight';
import { readSea, SeaReading } from '../core/insights/sea.insight';
import { skyLabel } from '../core/insights/sky.insight';
import { drawingSunTimes } from '../core/insights/sun.insight';
import { dayVerdict, Verdict } from '../core/insights/verdict.insight';
import { readWind, WindReading } from '../core/insights/wind.insight';
import { Location } from '../core/models';
import { formatTime } from '../core/utils/time';

/*
 * The card other websites embed (/widget/{zona}): a place's weather now, in
 * a few lines, with the same verdict as its page on LanzaMet. Pure: the
 * Worker (server/worker.ts) hands over Open-Meteo's answers and serves the
 * HTML; nothing here runs in the visitor's browser, and the card itself has
 * no script, no font, no image and no cookie.
 */

export type WidgetTheme = 'auto' | 'light' | 'dark';
export const WIDGET_THEMES: readonly WidgetTheme[] = ['auto', 'light', 'dark'];

/** Open-Meteo's answers for one place: its forecast, and its dust and sea when they came. */
export interface WidgetAnswers {
  readonly forecast: ForecastDto;
  readonly dust: AirQualityDto | null;
  readonly marine: MarineDto | null;
}

export interface WidgetView {
  readonly location: Location;
  readonly at: Date;
  readonly temperature: number;
  readonly sky: Msg;
  readonly wind: WindReading;
  readonly windKmh: number;
  readonly sea: SeaReading | null;
  readonly verdict: Verdict;
}

/** The place now, read with the same rules as its page. Throws when the forecast is incomplete. */
export function widgetView(location: Location, answers: WidgetAnswers, now: Date): WidgetView {
  const forecast = toWeatherForecast(location.id, answers.forecast, answers.dust, now, now);
  const sea = answers.marine ? toSeaForecast(location.id, answers.marine, now, now) : null;
  const weather = forecast.current;
  const sun = drawingSunTimes(forecast.daily[0], now);
  return {
    location,
    at: now,
    temperature: Math.round(weather.temperatureC),
    sky: skyLabel(weather.sky, weather.isDaylight),
    wind: readWind(weather.wind),
    windKmh: Math.round(weather.wind.speedKmh),
    sea: sea ? readSea(sea.current) : null,
    verdict: dayVerdict({
      location,
      weather,
      upcoming: stepsFrom(forecast.hourly, now),
      sea: sea?.current ?? null,
      day: 'today',
      at: now,
      sun,
    }),
  };
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Colours from the site's tokens (src/styles/_tokens.scss), written out: the card has no stylesheet of its own to link. */
const LIGHT = `--bg: oklch(1 0 0); --sunken: oklch(0.958 0.007 230); --ink: oklch(0.21 0.01 55); --ink-2: oklch(0.42 0.014 55); --line: oklch(0.21 0.01 55 / 0.12); --accent: oklch(0.43 0.09 162);`;
const DARK = `--bg: oklch(0.21 0.022 258); --sunken: oklch(0.255 0.024 258); --ink: oklch(0.965 0.006 90); --ink-2: oklch(0.82 0.014 258); --line: oklch(0.96 0.01 258 / 0.14); --accent: oklch(0.82 0.1 162);`;

function themeCss(theme: WidgetTheme): string {
  if (theme === 'light') return `:root { ${LIGHT} color-scheme: light; }`;
  if (theme === 'dark') return `:root { ${DARK} color-scheme: dark; }`;
  return `:root { ${LIGHT} color-scheme: light dark; } @media (prefers-color-scheme: dark) { :root { ${DARK} } }`;
}

const STYLE = `
  * { box-sizing: border-box; }
  /* Transparent around the card, so its rounded corners sit on the host page. */
  html, body { margin: 0; height: 100%; background: transparent; }
  body {
    font: 15px/1.35 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    color: var(--ink);
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    padding: 14px 16px 12px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--bg);
    overflow: hidden;
  }
  .top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .place { margin: 0; font-size: 15px; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .when { flex: none; font-size: 13px; color: var(--ink-2); }
  .now { display: flex; align-items: baseline; gap: 10px; }
  .temp { font-size: 40px; line-height: 1; font-weight: 700; letter-spacing: -0.02em; }
  .sky { font-size: 15px; color: var(--ink-2); }
  .verdict { margin: 0; font-size: 16px; font-weight: 650; }
  .facts { margin: 0; padding: 0; list-style: none; font-size: 13.5px; color: var(--ink-2); }
  .facts li { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .more {
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    font-size: 13.5px;
    font-weight: 650;
    color: var(--accent);
    text-decoration: none;
  }
  .more:hover { text-decoration: underline; }
  .more:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
  .unavailable { margin: auto 0; color: var(--ink-2); }
`;

function page(lang: Lang, theme: WidgetTheme, title: string, body: string): string {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escape(title)}</title>
<style>${themeCss(theme)}${STYLE}</style>
</head>
<body>
${body}
</body>
</html>`;
}

/** The place's full forecast on LanzaMet, in the card's language: the one link the card has. */
export const widgetLink = (origin: string, location: Location, lang: Lang) =>
  origin + zonePath('weather', location.id, lang);

export function widgetHtml(
  view: WidgetView,
  lang: Lang,
  theme: WidgetTheme,
  origin: string,
): string {
  const t = (text: Msg) => escape(translate(text, lang));
  const { location } = view;
  const wind = msg('widget.wind', { wind: view.wind.labelFrom, speed: view.windKmh });
  const facts = [t(wind)];
  if (view.sea) {
    facts.push(
      view.sea.water
        ? t(msg('widget.sea', { waves: view.sea.waves, water: view.sea.water }))
        : t(view.sea.waves),
    );
  }
  const title = translate(msg('widget.title', { place: location.name }), lang);
  return page(
    lang,
    theme,
    `${title} · LanzaMet`,
    `<article class="card" aria-label="${escape(title)}">
  <div class="top">
    <h1 class="place">${escape(location.name)}</h1>
    <span class="when">${t(msg('widget.at', { time: formatTime(view.at) }))}</span>
  </div>
  <div class="now">
    <span class="temp">${view.temperature}°</span>
    <span class="sky">${t(view.sky)}</span>
  </div>
  <p class="verdict">${t(view.verdict.headline)}</p>
  <ul class="facts">${facts.map((fact) => `<li>${fact}</li>`).join('')}</ul>
  <a class="more" href="${escape(widgetLink(origin, location, lang))}" target="_blank" rel="noopener">${t(msg('widget.more'))} →</a>
</article>`,
  );
}

/** When the forecast can't be had: the card says so and still leads to the place's page. */
export function widgetUnavailableHtml(
  location: Location,
  lang: Lang,
  theme: WidgetTheme,
  origin: string,
): string {
  const t = (text: Msg) => escape(translate(text, lang));
  const title = translate(msg('widget.title', { place: location.name }), lang);
  return page(
    lang,
    theme,
    `${title} · LanzaMet`,
    `<article class="card" aria-label="${escape(title)}">
  <h1 class="place">${escape(location.name)}</h1>
  <p class="unavailable">${t(msg('widget.unavailable'))}</p>
  <a class="more" href="${escape(widgetLink(origin, location, lang))}" target="_blank" rel="noopener">${t(msg('widget.more'))} →</a>
</article>`,
  );
}
