import { translate } from '../../../core/i18n/translate';
import { readWind } from '../../../core/insights/wind.insight';
import { SHARE_CONFIG, shareLink } from '../../../core/share/share-config';
import { TestBed } from '@angular/core/testing';
import { cardEmoji, cardFileName, shareMessage } from './weather-card';

const calm = readWind({ speedKmh: 12, gustKmh: 16, fromDegrees: 30 });
const windy = readWind({ speedKmh: 38, gustKmh: 52, fromDegrees: 30 });

// 24 October 2026, island time is UTC+1 (summer time until the 25th).
const now = new Date('2026-10-24T13:36:00Z');
const base = {
  place: 'Famara',
  isNow: true,
  at: now,
  today: '2026-10-24',
  sky: 'despejado' as const,
  isDaylight: true,
  wind: calm,
};

const origin = (href: string) => {
  const url = new URL(href);
  return { origin: url.origin, protocol: url.protocol, hostname: url.hostname };
};

describe('share message', () => {
  it('says how it is now, with the link, in each language', () => {
    const message = shareMessage(base, 'https://example.org');
    expect(translate(message, 'es')).toBe(
      'Así está el tiempo en Famara ☀️🌊. Consulta la previsión completa de Lanzarote aquí: https://example.org',
    );
    expect(translate(message, 'en')).toBe(
      "Here's the weather in Famara ☀️🌊. Explore the full Lanzarote forecast here: https://example.org",
    );
  });

  it('names the hour when it is a forecast, today or tomorrow', () => {
    const later = { ...base, isNow: false, at: new Date('2026-10-24T17:00:00Z') };
    expect(translate(shareMessage(later, null), 'es')).toBe(
      'Así estará el tiempo en Famara hoy a las 18:00 ☀️🌊.',
    );
    const tomorrow = { ...later, at: new Date('2026-10-25T08:00:00Z') };
    expect(translate(shareMessage(tomorrow, null), 'en')).toBe(
      "Here's the forecast for Famara tomorrow at 08:00 ☀️🌊.",
    );
  });

  it('leaves the link out when there is none, instead of making one up', () => {
    expect(translate(shareMessage(base, null), 'es')).toBe('Así está el tiempo en Famara ☀️🌊.');
  });

  it('draws the sky and the sea, or the wind when it blows hard', () => {
    expect(cardEmoji({ sky: 'lluvia', isDaylight: true, wind: calm })).toBe('🌧️🌊');
    expect(cardEmoji({ sky: 'despejado', isDaylight: false, wind: windy })).toBe('🌙💨');
  });

  it('names the file after the place and the hour', () => {
    expect(cardFileName({ place: 'Órzola', at: now })).toBe('que-tal-hoy-orzola-1436.png');
    expect(cardFileName({ place: 'Puerto del Carmen', at: now })).toBe(
      'que-tal-hoy-puerto-del-carmen-1436.png',
    );
  });
});

describe('share link', () => {
  it('uses the configured address first', () => {
    expect(shareLink({ publicUrl: 'https://example.org' }, origin('http://localhost:4200'))).toBe(
      'https://example.org',
    );
  });

  it('falls back to where a deployed copy is served from', () => {
    expect(shareLink({ publicUrl: null }, origin('https://que-tal-hoy.example.net/zonas'))).toBe(
      'https://que-tal-hoy.example.net',
    );
  });

  it('gives no link from a local or private address', () => {
    for (const href of [
      'http://localhost:4200',
      'http://127.0.0.1:8080',
      'http://192.168.1.20:4200',
      'http://10.0.0.5',
      'http://172.20.1.1',
      'http://mac.local:4200',
    ]) {
      expect(shareLink({ publicUrl: null }, origin(href))).toBeNull();
    }
    expect(shareLink({ publicUrl: null }, null)).toBeNull();
  });

  it('has no address set by default', () => {
    expect(TestBed.inject(SHARE_CONFIG).publicUrl).toBeNull();
  });
});
