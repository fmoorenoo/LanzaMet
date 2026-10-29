import { inject, Service, signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  CanMatchFn,
  NavigationEnd,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { filter } from 'rxjs';
import { LOCATIONS } from '../data/locations';
import { langOfPath, readPath, zonePath, ZoneView } from '../i18n/localized-paths';
import { Location, LocationId } from '../models';
import { LocationsStore } from './locations.store';

/** The route parameter that names a place: /tiempo/:zona, /mar/:zona. */
export const ZONE_PARAM = 'zona';

export const zoneById = (id: string | undefined): Location | null =>
  LOCATIONS.find((l) => l.id === id) ?? null;

/**
 * Where a place is, for its pages' titles and descriptions: "Teguise,
 * Lanzarote", or just "Lanzarote" when the municipality shares its name
 * (Arrecife).
 */
export const zoneArea = (zone: Location): string =>
  zone.municipality === zone.name ? 'Lanzarote' : `${zone.municipality}, Lanzarote`;

/** The place an address names, if any (the deepest route's :zona). */
export function zoneOfState(state: RouterStateSnapshot | ActivatedRouteSnapshot): Location | null {
  let route = 'root' in state ? state.root : state;
  while (route.firstChild) route = route.firstChild;
  return zoneById(route.params[ZONE_PARAM]);
}

/** Only real places have a page; anything else is "page not found". */
export const knownZone: CanMatchFn = (_route, segments) => zoneById(segments[1]?.path) !== null;

/** Opening a place's page chooses it, as picking it does (and it is remembered). */
export const selectZone: CanActivateFn = (route) => {
  const zone = zoneById(route.params[ZONE_PARAM]);
  if (zone) inject(LocationsStore).select(zone.id);
  return true;
};

/**
 * Places and their addresses. Choosing a place where its weather or its sea
 * is on screen moves to that place's page, so the address always says which
 * place is shown and can be shared. Elsewhere (Zonas, Dónde ir) choosing only
 * remembers it, as before.
 */
@Service()
export class ZoneNavigation {
  private readonly router = inject(Router);
  private readonly locations = inject(LocationsStore);

  /** The place the address names: set on /tiempo/:zona and /mar/:zona, null elsewhere. */
  readonly routeZone = signal<Location | null>(null);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.routeZone.set(zoneOfState(this.router.routerState.snapshot)));
  }

  /** Which of a place's pages is on screen: Hoy counts as weather, Mar as sea. */
  view(): ZoneView | null {
    const address = readPath(this.router.url);
    if (!address) return null;
    if ('view' in address) return address.view;
    if (address.page === 'today') return 'weather';
    return address.page === 'sea' ? 'sea' : null;
  }

  /**
   * Another place, from where you are (the picker, a swipe across the scene).
   * On a weather or sea page the address follows, replacing the current entry
   * so going back doesn't walk through every place tried.
   */
  switchTo(id: LocationId): void {
    this.locations.select(id);
    const view = this.view();
    if (view) void this.router.navigateByUrl(this.pathOf(view, id), { replaceUrl: true });
  }

  /** A place's page, opened from elsewhere (a card, a plan). */
  open(id: LocationId, view: ZoneView = 'weather'): void {
    this.locations.select(id);
    void this.router.navigateByUrl(this.pathOf(view, id));
  }

  /** A place's page in the language on screen. */
  private pathOf(view: ZoneView, id: LocationId): string {
    return zonePath(view, id, langOfPath(this.router.url));
  }
}
