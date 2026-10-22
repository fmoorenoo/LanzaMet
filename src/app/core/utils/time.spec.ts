import {
  atIslandHour,
  formatDuration,
  formatTime,
  islandDateKey,
  islandDayStart,
  islandHour,
  islandOffsetMinutes,
  startOfIslandDay,
} from './time';

describe('island time', () => {
  it('knows Lanzarote is UTC+1 in summer and UTC+0 in winter', () => {
    expect(islandOffsetMinutes(new Date('2026-07-15T12:00:00Z'))).toBe(60);
    expect(islandOffsetMinutes(new Date('2026-12-15T12:00:00Z'))).toBe(0);
  });

  it('formats wall-clock time on the island', () => {
    expect(formatTime(new Date('2026-07-15T15:40:00Z'))).toBe('16:40');
    expect(islandHour(new Date('2026-07-15T15:30:00Z'))).toBe(16.5);
  });

  it('finds local midnight, including across the October clock change', () => {
    const now = new Date('2026-10-22T10:00:00Z');
    expect(startOfIslandDay(now).toISOString()).toBe('2026-10-21T23:00:00.000Z');
    // 25 October 2026: clocks go back; the day after starts at 00:00 UTC.
    expect(islandDayStart(now, 4).toISOString()).toBe('2026-10-26T00:00:00.000Z');
    expect(islandDateKey(islandDayStart(now, 4))).toBe('2026-10-26');
  });

  it('pins an island hour to the right instant', () => {
    const pinned = atIslandHour(new Date('2026-10-22T10:00:00Z'), 20.5);
    expect(formatTime(pinned)).toBe('20:30');
  });

  it('describes durations in plain words', () => {
    expect(formatDuration(45 * 60_000)).toBe('45 min');
    expect(formatDuration(130 * 60_000)).toBe('2 h 10 min');
    expect(formatDuration(60_000)).toBe('un momento');
  });
});
