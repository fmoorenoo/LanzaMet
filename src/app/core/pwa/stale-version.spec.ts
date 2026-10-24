import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { isStaleChunkError, reloadForNewVersion } from './stale-version';

describe('stale version after a deploy', () => {
  const reload = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    reload.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: { location: { reload } } } }],
    });
  });
  afterEach(() => localStorage.clear());

  const reloads = (error: unknown, now: number) =>
    TestBed.runInInjectionContext(() => reloadForNewVersion(error, now));

  it("recognises each browser's words for a lazy file that couldn't load", () => {
    for (const message of [
      'Failed to fetch dynamically imported module: https://x/chunk-ABC.js', // Chrome, Edge
      'error loading dynamically imported module: https://x/chunk-ABC.js', // Firefox
      'Importing a module script failed.', // Safari
    ]) {
      expect(isStaleChunkError(new TypeError(message))).toBe(true);
    }
    expect(isStaleChunkError(new Error('Http failure response'))).toBe(false);
    expect(isStaleChunkError('nope')).toBe(false);
  });

  it('reloads once to fetch the new version, and never loops', () => {
    const error = new TypeError('Failed to fetch dynamically imported module');
    expect(reloads(error, 1_000_000)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
    // The new page fails again at once: something else is wrong, stop here.
    expect(reloads(error, 1_010_000)).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
    // Much later, a new deploy: it may reload again.
    expect(reloads(error, 1_100_000)).toBe(true);
  });

  it('leaves other navigation errors alone', () => {
    expect(reloads(new Error('Cannot match any routes'), 1_000_000)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
