import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/**
 * Hoy lives at / and at /tiempo/:zona, Mar at /mar and /mar/:zona: the same
 * page for another place. Routes name their page in `data.page`.
 */
export const pageOf = (route: ActivatedRouteSnapshot | null | undefined): string | undefined => {
  let deepest = route;
  while (deepest?.firstChild) deepest = deepest.firstChild;
  return deepest?.data['page'] as string | undefined;
};

/**
 * Keeps the page on screen when only the place changes (/ → /tiempo/famara,
 * /tiempo/famara → /tiempo/arrieta), as choosing a place did before it had an
 * address: no new page, no lost state (the hour or day being looked at).
 */
export class SamePageReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    if (future.routeConfig === curr.routeConfig) return true;
    const page = future.data['page'] as string | undefined;
    return page !== undefined && page === curr.data['page'];
  }
}
