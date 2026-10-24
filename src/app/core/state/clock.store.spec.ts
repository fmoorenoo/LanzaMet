import { TestBed } from '@angular/core/testing';
import { formatTime } from '../utils/time';
import { ClockStore } from './clock.store';

describe('ClockStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 10:00:45 in Lanzarote (summer time, UTC+1).
    vi.setSystemTime(new Date('2026-07-15T09:00:45Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('turns with the minute, not half a minute late', () => {
    const clock = TestBed.inject(ClockStore);
    expect(formatTime(clock.now())).toBe('10:00');

    vi.advanceTimersByTime(14_000);
    expect(formatTime(clock.now())).toBe('10:00');

    vi.advanceTimersByTime(1_100);
    expect(formatTime(clock.now())).toBe('10:01');

    vi.advanceTimersByTime(60_000);
    expect(formatTime(clock.now())).toBe('10:02');
  });

  it('catches up when the tab comes back to the front', () => {
    const clock = TestBed.inject(ClockStore);
    // Background tabs throttle timers: the system clock runs on without them.
    vi.setSystemTime(new Date('2026-07-15T09:20:10Z'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(formatTime(clock.now())).toBe('10:20');
  });

  it('holds the data beat while the tab is hidden, and moves on when it is seen', () => {
    let state: DocumentVisibilityState = 'visible';
    const spy = vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => state);
    const clock = TestBed.inject(ClockStore);
    const first = clock.refreshBeat();

    state = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    // Two quarters of an hour in a forgotten tab: no new beat, so no request.
    vi.advanceTimersByTime(31 * 60_000);
    expect(clock.quarterKey()).toBe(first + 2);
    expect(clock.refreshBeat()).toBe(first);

    state = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(clock.refreshBeat()).toBe(first + 2);
    spy.mockRestore();
  });
});
