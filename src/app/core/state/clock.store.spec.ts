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
});
