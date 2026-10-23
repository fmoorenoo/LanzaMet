import { seaLevelFor, SeaLevel } from '../../core/insights/sea.insight';
import { drawingSunTimes } from '../../core/insights/sun.insight';
import { readWind } from '../../core/insights/wind.insight';
import {
  HorizonProfile,
  Location,
  SceneryId,
  SeaSnapshot,
  ShoreKind,
  WeatherSnapshot,
  ZoneConditions,
} from '../../core/models';
import { mix, Oklch, oklch, toCss, toHex } from '../../core/utils/color';
import { clamp, progress } from '../../core/utils/math';
import { TIME } from '../../core/utils/time';

/**
 * Presentation model for the atmospheric scene. Everything the illustration
 * shows is derived from data: the light from the hour and the sun, the
 * colour from cloud, dust and rain, the drift from the wind, the swell from
 * the sea state and the waterline from the tide.
 */
export interface SceneState {
  readonly sky: { readonly top: string; readonly mid: string; readonly low: string };
  /** sRGB of the top of the sky, for the browser's status bar. */
  readonly topHex: string;
  readonly sea: {
    readonly far: string;
    readonly near: string;
    readonly shallow: string;
    /** Fills for the far and middle swell lines. */
    readonly swellFar: string;
    readonly swellMid: string;
    /** Opacity of the foam on the breaking line. */
    readonly foam: number;
  };
  readonly land: { readonly far: string; readonly near: string };
  readonly shore: string;
  /** Colours of the place's own landmarks (see scenery.ts). */
  readonly built: {
    /** Whitewashed walls in the light of the hour, and their shaded sides. */
    readonly wall: string;
    readonly shade: string;
    /** Windows, barely there by day, and glass: both lamplit after dark. */
    readonly window: string;
    readonly glass: string;
    /** Lanterns and harbour lights, and how strongly they shine (0 by day). */
    readonly lamp: string;
    readonly lights: number;
    /** The stripe on a fishing boat. */
    readonly trim: string;
    readonly palm: string;
    readonly lagoon: string;
    /** Volcanic rock bands, ochre, rust and black. */
    readonly rock: readonly [string, string, string];
    readonly sails: readonly [string, string, string];
  };
  readonly cloud: string;
  readonly sun: {
    readonly x: number;
    readonly y: number;
    readonly visible: number;
    readonly color: string;
    readonly lowSun: boolean;
  };
  readonly moon: { readonly x: number; readonly y: number; readonly visible: number };
  readonly stars: number;
  /** 0–1 cloud cover. */
  readonly clouds: number;
  readonly haze: number;
  readonly rain: boolean;
  /** 0–1, how hard it rains (0 when dry); unknown intensity draws moderate rain. */
  readonly rainIntensity: number;
  /** 0–1, how hard the wind blows. */
  readonly wind: number;
  readonly seaLevel: SeaLevel;
  /** 0 low tide … 1 high tide; 0.5 when unknown. */
  readonly tide: number;
  readonly horizon: HorizonProfile;
  readonly shoreKind: ShoreKind;
  readonly scenery: SceneryId;
  /** 0 night … 1 full day. */
  readonly daylight: number;
  /** Text colour that reads on this sky. */
  readonly ink: 'light' | 'dark';
}

export interface SceneInput {
  readonly location: Location;
  readonly weather: WeatherSnapshot;
  readonly sea: SeaSnapshot | null;
  readonly tideLevel: number | null;
  readonly sunrise: Date;
  readonly sunset: Date;
  readonly at: Date;
}

interface Palette {
  readonly top: Oklch;
  readonly mid: Oklch;
  readonly low: Oklch;
  readonly seaFar: Oklch;
  readonly seaNear: Oklch;
}

const P = (top: Oklch, mid: Oklch, low: Oklch, seaFar: Oklch, seaNear: Oklch): Palette => ({
  top,
  mid,
  low,
  seaFar,
  seaNear,
});

// Light over the Atlantic through a Lanzarote day, clear-sky version.
const NIGHT = P(
  oklch(0.2, 0.045, 268),
  oklch(0.25, 0.055, 262),
  oklch(0.32, 0.06, 250),
  oklch(0.27, 0.05, 255),
  oklch(0.2, 0.045, 258),
);
const FIRST_LIGHT = P(
  oklch(0.3, 0.07, 280),
  oklch(0.5, 0.09, 322),
  oklch(0.74, 0.1, 48),
  oklch(0.42, 0.06, 295),
  oklch(0.3, 0.06, 265),
);
const DAWN = P(
  oklch(0.45, 0.1, 258),
  oklch(0.62, 0.08, 330),
  oklch(0.85, 0.09, 66),
  oklch(0.56, 0.07, 255),
  oklch(0.42, 0.08, 248),
);
// Daytime mids stay deep enough for white text (checked at 4.5:1 with the hero shade).
const MORNING = P(
  oklch(0.5, 0.12, 248),
  oklch(0.6, 0.11, 240),
  oklch(0.85, 0.06, 225),
  oklch(0.56, 0.11, 236),
  oklch(0.44, 0.1, 240),
);
const MIDDAY = P(
  oklch(0.47, 0.135, 251),
  oklch(0.59, 0.12, 243),
  oklch(0.85, 0.055, 225),
  oklch(0.55, 0.12, 236),
  oklch(0.43, 0.11, 240),
);
const AFTERNOON = P(
  oklch(0.48, 0.12, 253),
  oklch(0.6, 0.11, 246),
  oklch(0.86, 0.06, 80),
  oklch(0.55, 0.11, 238),
  oklch(0.43, 0.1, 242),
);
const GOLDEN = P(
  oklch(0.46, 0.1, 258),
  oklch(0.63, 0.09, 52),
  oklch(0.84, 0.12, 74),
  oklch(0.56, 0.08, 248),
  oklch(0.42, 0.08, 252),
);
const SUNSET = P(
  oklch(0.35, 0.09, 282),
  oklch(0.6, 0.14, 30),
  oklch(0.76, 0.15, 60),
  oklch(0.5, 0.1, 22),
  oklch(0.34, 0.08, 280),
);
const DUSK = P(
  oklch(0.26, 0.07, 276),
  oklch(0.36, 0.09, 312),
  oklch(0.5, 0.1, 36),
  oklch(0.34, 0.06, 292),
  oklch(0.25, 0.05, 266),
);

interface Keyframe {
  readonly anchor: 'sunrise' | 'noon' | 'sunset';
  readonly minutes: number;
  readonly palette: Palette;
}

const KEYFRAMES: readonly Keyframe[] = [
  { anchor: 'sunrise', minutes: -80, palette: NIGHT },
  { anchor: 'sunrise', minutes: -25, palette: FIRST_LIGHT },
  { anchor: 'sunrise', minutes: 15, palette: DAWN },
  { anchor: 'sunrise', minutes: 95, palette: MORNING },
  { anchor: 'noon', minutes: 0, palette: MIDDAY },
  { anchor: 'sunset', minutes: -100, palette: AFTERNOON },
  { anchor: 'sunset', minutes: -30, palette: GOLDEN },
  { anchor: 'sunset', minutes: 4, palette: SUNSET },
  { anchor: 'sunset', minutes: 35, palette: DUSK },
  { anchor: 'sunset', minutes: 80, palette: NIGHT },
];

const SHORE: Readonly<Record<ShoreKind, Oklch>> = {
  'arena-dorada': oklch(0.83, 0.075, 80),
  'arena-negra': oklch(0.3, 0.012, 55),
  roca: oklch(0.36, 0.02, 48),
};

const PICON = oklch(0.3, 0.02, 50);
const PICON_DARK = oklch(0.22, 0.02, 45);
const NIGHT_SHADE = oklch(0.2, 0.035, 262);
const SHALLOW = oklch(0.72, 0.1, 192);
const CAL = oklch(0.95, 0.012, 85);
// Blue-green, like the Gran Hotel's glass.
const DAY_GLASS = oklch(0.56, 0.075, 192);
const LAMP = oklch(0.88, 0.13, 82);
const MANRIQUE_GREEN = oklch(0.5, 0.1, 158);
const PALM = oklch(0.4, 0.07, 138);
const LAGOON = oklch(0.6, 0.14, 152);
const ROCK = [oklch(0.54, 0.09, 52), oklch(0.44, 0.1, 36), oklch(0.31, 0.03, 40)] as const;
const SAILS = [oklch(0.68, 0.17, 38), oklch(0.66, 0.12, 205), oklch(0.85, 0.15, 95)] as const;

function mixPalette(a: Palette, b: Palette, t: number): Palette {
  return P(
    mix(a.top, b.top, t),
    mix(a.mid, b.mid, t),
    mix(a.low, b.low, t),
    mix(a.seaFar, b.seaFar, t),
    mix(a.seaNear, b.seaNear, t),
  );
}

function clearSky(input: SceneInput): Palette {
  const sunrise = input.sunrise.getTime();
  const sunset = input.sunset.getTime();
  const noon = (sunrise + sunset) / 2;
  const base = { sunrise, noon, sunset };
  const times = KEYFRAMES.map((k) => base[k.anchor] + k.minutes * TIME.MINUTE);
  const t = input.at.getTime();
  if (t <= times[0] || t >= times[times.length - 1]) return NIGHT;
  const i = times.findIndex((time) => time > t) - 1;
  return mixPalette(
    KEYFRAMES[i].palette,
    KEYFRAMES[i + 1].palette,
    progress(t, times[i], times[i + 1]),
  );
}

/** Weather mutes, dusts or darkens the clear-sky light. */
function weatherShift(
  color: Oklch,
  clouds: number,
  haze: number,
  rain: boolean,
  daylight: number,
): Oklch {
  let c = color;
  const overcast = Math.pow(clouds, 1.3) * 0.8;
  c = mix(c, oklch(c[0] * 0.82 + 0.1, c[1] * 0.16, c[2]), overcast);
  if (haze > 0) {
    const dust = mix(oklch(c[0] + 0.05, 0.03, 60), oklch(0.78, 0.05, 78), daylight);
    c = mix(c, dust, haze * 0.82);
  }
  if (rain) c = oklch(c[0] - 0.07, c[1] * 0.5, c[2]);
  return c;
}

/**
 * Sun and moon travel the right-hand sky, clear of the words on the left:
 * low and to the left at dawn, high at noon, low and right at dusk.
 * Coordinates are percentages of the sky (horizon = 100%).
 */
function arc(progressAcross: number, height: number): { x: number; y: number } {
  const p = clamp(progressAcross, -0.04, 1.04);
  return { x: 62 + 30 * p, y: 97 - Math.sin(Math.PI * clamp(p)) * height };
}

/** A place's scene right now, for cards and previews. */
export function zoneScene(zone: ZoneConditions, at: Date): SceneState {
  return buildScene({
    location: zone.location,
    weather: zone.weather.current,
    sea: zone.sea?.current ?? null,
    tideLevel: null,
    ...drawingSunTimes(zone.weather.daily[0], at),
    at,
  });
}

export function buildScene(input: SceneInput): SceneState {
  const { weather } = input;
  const clear = clearSky(input);
  // How much daylight the clear sky carries (0 night … 1 full day).
  const daylight = progress(clear.mid[0], 0.27, 0.62);
  const haze = weather.sky === 'calima' ? 0.85 : 0;
  const rain = weather.sky === 'lluvia';
  const clouds = weather.cloudCover;
  const shift = (c: Oklch) => weatherShift(c, clouds, haze, rain, daylight);

  const top = shift(clear.top);
  const mid = shift(clear.mid);
  const low = shift(clear.low);
  // Dust hangs in the air more than it tints the water.
  const seaShift = (c: Oklch) => weatherShift(c, clouds, haze * 0.4, rain, daylight);
  const seaFar = seaShift(mix(clear.seaFar, clear.mid, 0.12));
  const seaNear = seaShift(clear.seaNear);

  const sunrise = input.sunrise.getTime();
  const sunset = input.sunset.getTime();
  const t = input.at.getTime();
  const dayProgress = (t - sunrise) / (sunset - sunrise);
  const sunPos = arc(dayProgress, 64);
  const lowSun = dayProgress < 0.1 || dayProgress > 0.88;
  const sunUp = t > sunrise - 12 * TIME.MINUTE && t < sunset + 12 * TIME.MINUTE;
  const sunVisible = sunUp
    ? clamp(1 - Math.max(0, clouds - 0.55) * 1.8) * (haze ? 0.7 : 1) * (rain ? 0.2 : 1)
    : 0;

  const nightLength = 24 * TIME.HOUR - (sunset - sunrise);
  const nightProgress =
    t >= sunset ? (t - sunset) / nightLength : (t - (sunrise - nightLength)) / nightLength;
  const moonPos = arc(nightProgress, 56);
  const moonVisible = sunUp ? 0 : clamp(1 - Math.max(0, clouds - 0.6) * 2);

  const cloud = mix(
    mix(oklch(0.34, 0.02, 262), oklch(0.97, 0.01, 240), daylight),
    mid,
    0.18 + 0.3 * (1 - daylight) + (lowSun ? 0.25 : 0),
  );

  const seaLevel: SeaLevel = input.sea
    ? seaLevelFor(input.sea.waveHeightM)
    : (Math.min(3, readWind(weather.wind).level) as SeaLevel);

  const shore = mix(mix(SHORE[input.location.shore], low, 0.1), NIGHT_SHADE, (1 - daylight) * 0.72);

  // Landmarks take the hour's light and fall into shade after dark, though a
  // little less than the land, so a town still reads against its hills.
  const dark = 1 - daylight;
  const lit = (c: Oklch, toward = 0.2, night = 0.72) =>
    mix(mix(c, low, toward), NIGHT_SHADE, dark * night);
  const wall = lit(CAL, 0.18, 0.66);
  const lights = clamp(dark * 1.5 - 0.35);
  const tones = <T extends readonly [Oklch, Oklch, Oklch]>(set: T, toward: number) =>
    [toCss(lit(set[0], toward)), toCss(lit(set[1], toward)), toCss(lit(set[2], toward))] as const;

  return {
    sky: { top: toCss(top), mid: toCss(mid), low: toCss(low) },
    topHex: toHex(top),
    sea: {
      far: toCss(seaFar),
      near: toCss(seaNear),
      shallow: toCss(
        input.location.shore === 'arena-dorada'
          ? mix(seaNear, shift(SHALLOW), 0.42 * daylight)
          : seaNear,
      ),
      swellFar: toCss(mix(seaFar, seaNear, 0.3)),
      swellMid: toCss(mix(seaFar, seaNear, 0.65)),
      foam: 0.2 + 0.45 * daylight,
    },
    land: { far: toCss(mix(low, PICON, 0.38)), near: toCss(mix(low, PICON_DARK, 0.7)) },
    shore: toCss(shore),
    built: {
      wall: toCss(wall),
      shade: toCss(mix(wall, mix(PICON, NIGHT_SHADE, dark), 0.32)),
      window: toCss(mix(mix(wall, lit(DAY_GLASS, 0.3), 0.3), LAMP, lights * 0.85)),
      // Big panes stay dark after dusk, warmed a little from inside: a tower is never a lantern.
      glass: toCss(mix(lit(DAY_GLASS, 0.3), LAMP, lights * 0.28)),
      lamp: toCss(LAMP),
      lights,
      trim: toCss(lit(MANRIQUE_GREEN, 0.1)),
      palm: toCss(lit(mix(PALM, PICON_DARK, 0.2), 0.15)),
      lagoon: toCss(lit(LAGOON, 0.1, 0.8)),
      rock: tones(ROCK, 0.12),
      sails: tones(SAILS, 0.1),
    },
    cloud: toCss(cloud),
    sun: {
      x: sunPos.x,
      y: sunPos.y,
      visible: sunVisible,
      color: toCss(lowSun ? oklch(0.84, 0.15, 60) : oklch(0.96, 0.1, 96)),
      lowSun,
    },
    moon: { x: moonPos.x, y: moonPos.y, visible: moonVisible },
    stars: Math.pow(1 - daylight, 2) * clamp(1 - clouds * 1.4) * (haze ? 0.3 : 1),
    clouds,
    haze: haze * (0.5 + 0.5 * daylight),
    rain,
    rainIntensity: rain ? (weather.rainIntensity ?? 0.6) : 0,
    wind: readWind(weather.wind).strength,
    seaLevel,
    tide: input.tideLevel ?? 0.5,
    horizon: input.location.horizon,
    shoreKind: input.location.shore,
    scenery: input.location.scenery,
    daylight,
    ink: top[0] > 0.62 && mid[0] > 0.6 ? 'dark' : 'light',
  };
}
