import { ActivatedRouteSnapshot, Route } from '@angular/router';
import { pageOf, SamePageReuseStrategy } from './same-page';

const snapshot = (routeConfig: Route, page?: string) =>
  ({
    routeConfig,
    data: page ? { page } : {},
    firstChild: null,
  }) as unknown as ActivatedRouteSnapshot;

describe('SamePageReuseStrategy', () => {
  const strategy = new SamePageReuseStrategy();
  const today: Route = { path: '' };
  const todayZone: Route = { path: 'tiempo/:zona' };
  const sea: Route = { path: 'mar' };

  it('keeps Hoy on screen when only the place changes', () => {
    expect(strategy.shouldReuseRoute(snapshot(todayZone, 'today'), snapshot(today, 'today'))).toBe(
      true,
    );
    expect(
      strategy.shouldReuseRoute(snapshot(todayZone, 'today'), snapshot(todayZone, 'today')),
    ).toBe(true);
  });

  it('changes page between sections', () => {
    expect(strategy.shouldReuseRoute(snapshot(sea, 'sea'), snapshot(today, 'today'))).toBe(false);
    expect(strategy.shouldReuseRoute(snapshot({ path: 'zonas' }), snapshot(today, 'today'))).toBe(
      false,
    );
    expect(pageOf(snapshot(sea, 'sea'))).toBe('sea');
  });
});
