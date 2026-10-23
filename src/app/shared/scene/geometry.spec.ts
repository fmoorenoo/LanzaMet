import { RAIN_DROPS, rainDropCount } from './geometry';

const value = (style: string, name: string) =>
  parseFloat(new RegExp(`--${name}:(-?[\\d.]+)`).exec(style)?.[1] ?? 'NaN');

describe('rain', () => {
  it('draws more streaks the harder it rains, none when dry and few on cards', () => {
    expect(rainDropCount(0, false)).toBe(0);
    const drizzle = rainDropCount(0.15, false);
    const rain = rainDropCount(0.6, false);
    const downpour = rainDropCount(1, false);
    expect(drizzle).toBeLessThan(rain);
    expect(rain).toBeLessThan(downpour);
    expect(downpour).toBeLessThanOrEqual(RAIN_DROPS.length);
    expect(rainDropCount(1, true)).toBeLessThan(downpour / 2);
  });

  it('spreads any first streaks over the whole sky, without a regular grid', () => {
    for (const count of [rainDropCount(0.15, false), rainDropCount(1, true)]) {
      const xs = RAIN_DROPS.slice(0, count).map((d) => value(d.style, 'x'));
      // Every tenth of the width gets rain.
      const tenths = new Set(xs.map((x) => Math.floor(x * 10)));
      expect(tenths.size).toBe(10);
      // Gaps between neighbours are uneven.
      const sorted = [...xs].sort((a, b) => a - b);
      const gaps = sorted.slice(1).map((x, i) => x - sorted[i]);
      expect(Math.max(...gaps) / Math.min(...gaps)).toBeGreaterThan(2);
    }
  });

  it('never moves two streaks in step', () => {
    const timings = RAIN_DROPS.map((d) => `${value(d.style, 't')}|${value(d.style, 'd')}`);
    expect(new Set(timings).size).toBe(RAIN_DROPS.length);
    for (const drop of RAIN_DROPS) {
      const seconds = value(drop.style, 't');
      const delay = value(drop.style, 'd');
      expect(seconds).toBeGreaterThanOrEqual(0.6);
      expect(seconds).toBeLessThanOrEqual(1.35);
      // A negative delay starts each one part-way through its fall.
      expect(delay).toBeLessThanOrEqual(0);
      expect(delay).toBeGreaterThan(-seconds);
    }
  });
});
