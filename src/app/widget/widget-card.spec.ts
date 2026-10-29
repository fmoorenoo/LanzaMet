import dustFixture from '../core/data/http/fixtures/dust-arrecife.json';
import forecastFixture from '../core/data/http/fixtures/forecast-arrecife.json';
import marineFixture from '../core/data/http/fixtures/marine-arrecife.json';
import { AirQualityDto, ForecastDto, MarineDto } from '../core/data/http/open-meteo.dto';
import { LOCATIONS } from '../core/data/locations';
import { translate } from '../core/i18n/translate';
import { widgetHtml, widgetUnavailableHtml, widgetView } from './widget-card';

const forecast = forecastFixture as unknown as ForecastDto;
const dust = dustFixture as unknown as AirQualityDto;
const marine = marineFixture as unknown as MarineDto;
const arrecife = LOCATIONS.find((l) => l.id === 'arrecife')!;
const now = new Date(forecast.current.time * 1000);
const ORIGIN = 'https://lanzamet.com';

describe('widget card', () => {
  const view = widgetView(arrecife, { forecast, dust, marine }, now);

  it('reads the place now with the same rules as its page', () => {
    expect(view.temperature).toBe(Math.round(forecast.current.temperature_2m!));
    expect(view.windKmh).toBe(Math.round(forecast.current.wind_speed_10m!));
    expect(view.sea).not.toBeNull();
    expect(translate(view.verdict.headline, 'es')).not.toBe('');
  });

  it('speaks the language asked for and leads to the place’s page in it', () => {
    const es = widgetHtml(view, 'es', 'auto', ORIGIN);
    expect(es).toContain('<html lang="es">');
    expect(es).toContain('<title>El tiempo en Arrecife · LanzaMet</title>');
    expect(es).toContain('href="https://lanzamet.com/tiempo/arrecife"');
    expect(es).toContain('Previsión completa en LanzaMet');

    const en = widgetHtml(view, 'en', 'auto', ORIGIN);
    expect(en).toContain('<html lang="en">');
    expect(en).toContain('<title>Arrecife weather · LanzaMet</title>');
    expect(en).toContain('href="https://lanzamet.com/en/weather/arrecife"');
    expect(en).toContain(`${view.temperature}°`);
  });

  it('has no script, no outside resource and stays out of search results', () => {
    const html = widgetHtml(view, 'es', 'dark', ORIGIN);
    expect(html).not.toMatch(/<script|<img|<link|src=/i);
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain('color-scheme: dark');
    expect(widgetHtml(view, 'es', 'auto', ORIGIN)).toContain('prefers-color-scheme: dark');
  });

  it('still works without the sea', () => {
    const dry = widgetView(arrecife, { forecast, dust: null, marine: null }, now);
    expect(dry.sea).toBeNull();
    expect(widgetHtml(dry, 'es', 'light', ORIGIN).match(/<li>/g)).toHaveLength(1);
  });

  it('says so when the forecast is missing, and still links to the place', () => {
    const html = widgetUnavailableHtml(arrecife, 'en', 'auto', ORIGIN);
    expect(html).toContain("The forecast isn't available right now.");
    expect(html).toContain('href="https://lanzamet.com/en/weather/arrecife"');
  });
});
