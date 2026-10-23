import { LOCATIONS } from '../data/locations';
import { Lang, Msg } from '../i18n/i18n.model';
import { translate } from '../i18n/translate';
import { SeaSnapshot, SkyCondition, WeatherSnapshot } from '../models';
import { dayPeriod, isSunUp } from './day-period';
import { SunTimes } from './sun.insight';
import { beachScore, dayVerdict, VerdictInput } from './verdict.insight';
import { readWind } from './wind.insight';

/** The rules return descriptors; read them in a language to check the words. */
const say = (text: Msg, lang: Lang = 'es') => translate(text, lang);

const puertoDelCarmen = LOCATIONS.find((l) => l.id === 'puerto-del-carmen')!;

// 23 October 2026 in Puerto del Carmen (UTC+1): sunrise 08:01, sunset 19:16.
const SUN: SunTimes = {
  sunrise: new Date('2026-10-23T07:01:00Z'),
  sunset: new Date('2026-10-23T18:16:00Z'),
};
const at = (hhmm: string) => new Date(`2026-10-23T${hhmm}:00+01:00`);

const sunnyCalm: WeatherSnapshot = {
  time: '2026-10-23T13:00:00.000Z',
  temperatureC: 25,
  feelsLikeC: 26,
  sky: 'despejado',
  cloudCover: 0.05,
  precipitationChance: 0,
  uvIndex: 7,
  wind: { speedKmh: 12, gustKmh: 18, fromDegrees: 30 },
  isDaylight: true,
};

const calmSea: SeaSnapshot = {
  time: '',
  waveHeightM: 0.3,
  wavePeriodS: 7,
  waveFromDegrees: 330,
  swell: null,
  waterTemperatureC: 22,
};

function verdictAt(
  hhmm: string,
  weather: Partial<WeatherSnapshot> = {},
  extra: Partial<VerdictInput> = {},
) {
  const moment = at(hhmm);
  const snapshot = { ...sunnyCalm, isDaylight: isSunUp(moment, SUN), ...weather };
  return dayVerdict({
    location: puertoDelCarmen,
    weather: snapshot,
    upcoming: [snapshot, snapshot],
    sea: calmSea,
    day: 'today',
    at: moment,
    sun: SUN,
    ...extra,
  });
}

describe('verdict', () => {
  it('invites to the beach on a sunny, calm day', () => {
    const verdict = verdictAt('14:00');
    expect(say(verdict.headline)).toBe('Hoy apetece playa');
    expect(say(verdict.sentence)).toBe('Sol y brisa suave en Puerto del Carmen.');
    // Same rule, same data, other language.
    expect(say(verdict.headline, 'en')).toBe('A beach day today');
    expect(say(verdict.sentence, 'en')).toBe('Sunshine with a light breeze in Puerto del Carmen.');
  });

  it('does not invite to the beach while the sea is unknown', () => {
    expect(say(verdictAt('11:00', {}, { sea: null }).headline)).toBe('Buen día para salir');
    expect(say(verdictAt('16:30', {}, { sea: null }).headline)).toBe('Buena tarde para salir');
  });

  it('warns when the wind is picking up', () => {
    const windy = { ...sunnyCalm, wind: { speedKmh: 32, gustKmh: 44, fromDegrees: 30 } };
    const verdict = verdictAt('11:00', {}, { upcoming: [sunnyCalm, windy, windy] });
    expect(say(verdict.headline)).toBe('El viento se está levantando');
    expect(say(verdict.headline, 'en')).toBe('The wind is picking up');
  });

  it('scores no beach at night', () => {
    expect(beachScore({ ...sunnyCalm, isDaylight: false }, null)).toBe(0);
  });
});

describe('verdict through the day', () => {
  it('greets 07:30 in October as first light, not as a mild night', () => {
    const verdict = verdictAt('07:30', { temperatureC: 20 });
    expect(say(verdict.headline)).toBe('Amanece despejado');
    expect(say(verdict.sentence)).toBe('Cielo despejado y brisa suave. Amanece a las 08:01.');
    expect(say(verdict.headline, 'en')).toBe('A clear dawn');
    expect(say(verdict.sentence, 'en')).toBe('Clear skies with a light breeze. Sunrise at 08:01.');
  });

  it('stops counting down to sunrise once the sun is up', () => {
    const verdict = verdictAt('08:30', { temperatureC: 20, sky: 'poco-nuboso' });
    expect(say(verdict.headline)).toBe('Amanece templado');
    expect(say(verdict.sentence)).toBe('Sol entre nubes y brisa suave en Puerto del Carmen.');
  });

  it('says how the day starts when it is cool or cloudy', () => {
    expect(say(verdictAt('07:30', { temperatureC: 15 }).headline)).toBe('Amanece fresco');
    expect(say(verdictAt('07:30', { sky: 'cubierto' }).headline)).toBe('Amanece nublado');
  });

  it('calls the hours before first light the small hours', () => {
    expect(say(verdictAt('06:30', { temperatureC: 19 }).headline)).toBe('Madrugada templada');
    expect(say(verdictAt('03:00', { temperatureC: 15 }).headline)).toBe('Madrugada fresca');
    expect(say(verdictAt('03:00', { temperatureC: 15 }).headline, 'en')).toBe(
      'Cool in the small hours',
    );
  });

  it('describes the night by its temperature and its sky', () => {
    expect(say(verdictAt('23:00', { temperatureC: 19 }).headline)).toBe('Noche estrellada');
    expect(say(verdictAt('23:00', { temperatureC: 19, sky: 'cubierto' }).headline)).toBe(
      'Noche nublada',
    );
    expect(say(verdictAt('23:00', { temperatureC: 19, sky: 'nuboso' }).headline)).toBe(
      'Noche templada',
    );
    expect(say(verdictAt('00:30', { temperatureC: 24 }).headline)).toBe('Noche cálida');
  });

  it('gives the time of sunset while the sun is still up', () => {
    const before = verdictAt('18:40');
    expect(say(before.headline)).toBe('Atardecer despejado');
    expect(say(before.sentence)).toBe('Sol y brisa suave. El sol se pone a las 19:16.');
    expect(say(before.sentence, 'en')).toBe('Sunshine with a light breeze. Sunset at 19:16.');

    const after = verdictAt('19:40');
    expect(say(after.headline)).toBe('Atardecer despejado');
    expect(say(after.sentence)).toBe('Cielo despejado y brisa suave en Puerto del Carmen.');

    expect(say(verdictAt('18:40', { sky: 'poco-nuboso' }).headline)).toBe('Atardecer entre nubes');
    expect(say(verdictAt('18:40', { sky: 'cubierto' }).headline)).toBe('Atardecer gris');
  });

  it('suits the beach invitation to the afternoon and to tomorrow', () => {
    expect(say(verdictAt('16:30').headline)).toBe('Tarde de playa');
    expect(say(verdictAt('11:00', {}, { day: 'tomorrow' }).headline)).toBe('Mañana apetece playa');
  });

  it('warns about rain in words for the moment', () => {
    expect(say(verdictAt('02:00', { sky: 'lluvia' }).headline)).toBe('Noche de lluvia');
    expect(say(verdictAt('07:30', { sky: 'lluvia' }).headline)).toBe('Amanece lloviendo');
    expect(say(verdictAt('12:00', { sky: 'lluvia' }).headline)).toBe('Llueve, cosa rara');
  });

  it('keeps strong wind advice about beaches to the hours when it matters', () => {
    const gale = { wind: { speedKmh: 40, gustKmh: 55, fromDegrees: 30 } };
    expect(say(verdictAt('11:00', gale).sentence)).toBe(
      'Viento fuerte del nordeste. Mejor buscar una playa resguardada.',
    );
    expect(say(verdictAt('23:00', gale).headline)).toBe('Noche de viento');
    expect(say(verdictAt('23:00', gale).sentence)).toBe(
      'Cielo despejado y viento fuerte en Puerto del Carmen.',
    );
    expect(say(verdictAt('07:30', gale).headline)).toBe('Amanece con viento');
  });

  it('warns about heat and the fierce midday sun', () => {
    expect(say(verdictAt('16:00', { temperatureC: 33 }).headline)).toBe('Aprieta el calor');
    const fierce = verdictAt('14:00', { temperatureC: 28, uvIndex: 10 });
    expect(say(fierce.headline)).toBe('Sol de justicia');
    expect(say(fierce.sentence)).toBe(
      'Sol y brisa suave en Puerto del Carmen. Busca la sombra y bebe agua.',
    );
  });

  it('matches a grey sky to its temperature', () => {
    expect(say(verdictAt('11:00', { sky: 'cubierto', temperatureC: 17 }).headline)).toBe(
      'Día gris y fresco',
    );
    expect(say(verdictAt('11:00', { sky: 'cubierto', temperatureC: 22 }).headline)).toBe(
      'Día gris y templado',
    );
    expect(say(verdictAt('11:00', { sky: 'cubierto', temperatureC: 27 }).headline)).toBe(
      'Gris, pero cálido',
    );
  });
});

describe('verdict consistency', () => {
  const SKIES: readonly SkyCondition[] = [
    'despejado',
    'poco-nuboso',
    'nuboso',
    'cubierto',
    'calima',
    'lluvia',
  ];
  const TEMPERATURES = [14, 18, 21, 24, 28, 33];
  const WINDS = [3, 12, 24, 36, 50];
  const SEAS: readonly (SeaSnapshot | null)[] = [null, calmSea, { ...calmSea, waveHeightM: 2.6 }];
  // Every 20 minutes through the day, both sides of each boundary included.
  const MOMENTS = Array.from(
    { length: 72 },
    (_, i) => new Date(at('00:00').getTime() + i * 1_200_000),
  );

  const cases = MOMENTS.flatMap((moment) =>
    SKIES.flatMap((sky) =>
      TEMPERATURES.flatMap((temperatureC) =>
        WINDS.flatMap((speedKmh) =>
          SEAS.map((sea) => {
            const weather: WeatherSnapshot = {
              ...sunnyCalm,
              sky,
              temperatureC,
              uvIndex: 10,
              wind: { speedKmh, gustKmh: speedKmh + 8, fromDegrees: 20 },
              isDaylight: isSunUp(moment, SUN),
            };
            const verdict = dayVerdict({
              location: puertoDelCarmen,
              weather,
              upcoming: [weather],
              sea,
              day: 'today',
              at: moment,
              sun: SUN,
            });
            return { moment, weather, sea, verdict, period: dayPeriod(moment, SUN) };
          }),
        ),
      ),
    ),
  );

  const broken = (rule: (c: (typeof cases)[number]) => boolean) =>
    cases
      .filter((c) => !rule(c))
      .map((c) => `${c.verdict.headline.key} at ${c.moment.toISOString()} (${c.weather.sky})`)
      .slice(0, 5);

  it('only speaks of the night in the dark, and of dawn or sunset at their time', () => {
    expect(
      broken(({ verdict, period }) => {
        const key = verdict.headline.key;
        if (/night|smallHours/.test(key)) return period === 'noche' || period === 'madrugada';
        if (/dawn/.test(key)) return period === 'primera-hora';
        if (/sunset\.(clear|clouds|grey)/.test(key)) return period === 'atardecer';
        return true;
      }),
    ).toEqual([]);
  });

  it('never suggests the beach, the heat or the sun while the sun is down', () => {
    expect(
      broken(({ verdict, moment }) =>
        /beach|goodDay|goodAfternoon|lookout|hot|strongSun|sunnyWindy|waves/.test(
          verdict.headline.key,
        )
          ? isSunUp(moment, SUN)
          : true,
      ),
    ).toEqual([]);
  });

  it('never invites to the beach without knowing the sea, in rain or in strong wind', () => {
    expect(
      broken(({ verdict, sea, weather }) =>
        verdict.headline.key.startsWith('verdict.beach')
          ? sea !== null && weather.sky !== 'lluvia' && readWind(weather.wind).level < 3
          : true,
      ),
    ).toEqual([]);
  });

  it('keeps every headline true to the sky, the wind and the temperature', () => {
    expect(
      broken(({ verdict, weather }) => {
        const words = say(verdict.headline);
        const t = weather.temperatureC;
        const level = readWind(weather.wind).level;
        if (/despejado|estrellada/.test(words) && weather.sky !== 'despejado') return false;
        if (/gris|nublad/.test(words) && !['nuboso', 'cubierto'].includes(weather.sky)) {
          return false;
        }
        const dark = /night|smallHours|dawn/.test(verdict.headline.key);
        if (/cálid|calor/.test(words) && t < 23) return false;
        if (/fresc/.test(words) && t >= 19) return false;
        if (/templad/.test(words) && (t < 17 || t >= (dark ? 23 : 26))) return false;
        if (/tranquil|estrellada/.test(words) && level > 1) return false;
        if (/playa|Sol/.test(words) && ['lluvia', 'cubierto'].includes(weather.sky)) return false;
        return true;
      }),
    ).toEqual([]);
  });

  it('only gives sunrise and sunset times before they happen', () => {
    expect(
      broken(({ verdict, moment }) => {
        const words = say(verdict.sentence);
        if (words.includes('Amanece a las')) return moment < SUN.sunrise;
        if (words.includes('El sol se pone')) return moment < SUN.sunset;
        return true;
      }),
    ).toEqual([]);
  });

  it('reads the sky as night or day the same way in headline and sentence', () => {
    expect(
      broken(({ verdict, moment }) => {
        const sentence = say(verdict.sentence);
        // "Sol…" only in daylight; the night versions only in the dark.
        if (/^Sol/.test(sentence)) return isSunUp(moment, SUN);
        if (/^(Cielo despejado|Algunas nubes)/.test(sentence)) return !isSunUp(moment, SUN);
        return true;
      }),
    ).toEqual([]);
  });
});
