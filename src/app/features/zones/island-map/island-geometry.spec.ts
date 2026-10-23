import { LOCATIONS } from '../../../core/data/locations';
import { LA_GRACIOSA, LANZAROTE, MONTANA_CLARA } from './coastline';
import { MAP_SIZE, onLanzarote, project } from './island-geometry';

const point = ([latitude, longitude]: readonly [number, number]) => ({ latitude, longitude });

/** Kilometres between two points (haversine). */
function km(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

describe('island map', () => {
  it('pins every place on Lanzarote itself, not in the sea', () => {
    for (const location of LOCATIONS) {
      expect(onLanzarote(location.position), location.id).toBe(true);
    }
  });

  it('draws La Graciosa and Montaña Clara apart from Lanzarote', () => {
    for (const ring of [LA_GRACIOSA, MONTANA_CLARA]) {
      expect(ring.some((p) => onLanzarote(point(p)))).toBe(false);
    }
  });

  it('keeps every coast and marker inside the frame', () => {
    const all = [...LANZAROTE, ...LA_GRACIOSA, ...MONTANA_CLARA].map(point);
    for (const p of [...all, ...LOCATIONS.map((l) => l.position)]) {
      const { x, y } = project(p);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(MAP_SIZE.width);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(MAP_SIZE.height);
    }
  });

  it('keeps distances true in every direction (within 1 %)', () => {
    const at = (id: string) => LOCATIONS.find((l) => l.id === id)!.position;
    const pairs: [string, string][] = [
      ['orzola', 'playa-blanca'],
      ['famara', 'arrecife'],
      ['el-golfo', 'costa-teguise'],
    ];
    const ratios = pairs.map(([a, b]) => {
      const pa = project(at(a));
      const pb = project(at(b));
      return Math.hypot(pa.x - pb.x, pa.y - pb.y) / km(at(a), at(b));
    });
    for (const ratio of ratios) expect(Math.abs(ratio / ratios[0] - 1)).toBeLessThan(0.01);
  });
});
