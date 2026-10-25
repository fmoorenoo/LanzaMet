import { monotoneCurve } from './curve';

// An hourly tide around mean sea level: high, low, high.
const tide = [0.8, 0.6, 0.1, -0.6, -1.2, -1.3, -0.9, -0.2, 0.5, 0.95, 1.0, 0.7, 0.1].map(
  (y, x) => ({ x, y }),
);

describe('monotoneCurve', () => {
  it('passes through every point', () => {
    const curve = monotoneCurve(tide);
    for (const p of tide) expect(curve.at(p.x)).toBeCloseTo(p.y, 9);
  });

  it('never goes past the points either side of it: no invented highs or lows', () => {
    const curve = monotoneCurve(tide);
    for (let i = 0; i < tide.length - 1; i++) {
      const lo = Math.min(tide[i].y, tide[i + 1].y);
      const hi = Math.max(tide[i].y, tide[i + 1].y);
      for (let k = 1; k < 20; k++) {
        const y = curve.at(i + k / 20);
        expect(y).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(y).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
  });

  it('is flat where the water turns, so the low and the high stay where the data puts them', () => {
    const curve = monotoneCurve(tide);
    const slope = (x: number) => (curve.at(x + 1e-4) - curve.at(x - 1e-4)) / 2e-4;
    expect(Math.abs(slope(5))).toBeLessThan(1e-3); // the low, −1.3
    expect(Math.abs(slope(10))).toBeLessThan(1e-3); // the high, 1.0
  });

  it('takes extra points between the hours, such as an estimated high', () => {
    const curve = monotoneCurve([...tide, { x: 9.8, y: 1.02 }]);
    expect(curve.at(9.8)).toBeCloseTo(1.02, 9);
    expect(curve.points.map((p) => p.x)).toEqual(
      [...curve.points.map((p) => p.x)].sort((a, b) => a - b),
    );
  });

  it('draws one cubic segment per gap', () => {
    const { path } = monotoneCurve(tide);
    expect(path.startsWith('M0.0 0.8')).toBe(true);
    expect(path.match(/C/g)?.length).toBe(tide.length - 1);
  });

  it('handles a single point and an empty series', () => {
    expect(monotoneCurve([{ x: 2, y: 3 }]).at(5)).toBe(3);
    expect(monotoneCurve([]).path).toBe('');
  });
});
