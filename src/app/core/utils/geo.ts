import { GeoPoint } from '../models';

const KM_PER_DEGREE = 111.2;

/** Distance in km; flat-earth is plenty at the scale of an island. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const midLatitude = ((a.latitude + b.latitude) / 2) * (Math.PI / 180);
  const dLat = (a.latitude - b.latitude) * KM_PER_DEGREE;
  const dLon = (a.longitude - b.longitude) * KM_PER_DEGREE * Math.cos(midLatitude);
  return Math.hypot(dLat, dLon);
}
