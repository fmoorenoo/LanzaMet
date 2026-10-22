import { GeoPoint } from '../../core/models';

const RAD = Math.PI / 180;

export interface SunTimes {
  readonly sunrise: Date;
  readonly sunset: Date;
}

/**
 * Sunrise and sunset for the UTC calendar day that contains `day`
 * (NOAA general solar position approximation, ±1–2 min).
 * Real providers return these; the simulator needs them to stay coherent.
 */
export function sunTimes(day: Date, position: GeoPoint): SunTimes {
  const utcMidnight = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  const startOfYear = Date.UTC(day.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((utcMidnight - startOfYear) / 86_400_000) + 1;
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);

  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const lat = position.latitude * RAD;
  const cosHourAngle =
    Math.cos(90.833 * RAD) / (Math.cos(lat) * Math.cos(declination)) -
    Math.tan(lat) * Math.tan(declination);
  const hourAngle = Math.acos(Math.min(1, Math.max(-1, cosHourAngle))) / RAD;

  const sunriseMin = 720 - 4 * (position.longitude + hourAngle) - equationOfTime;
  const sunsetMin = 720 - 4 * (position.longitude - hourAngle) - equationOfTime;

  return {
    sunrise: new Date(utcMidnight + sunriseMin * 60_000),
    sunset: new Date(utcMidnight + sunsetMin * 60_000),
  };
}
