import { computed, linkedSignal, ResourceRef, Signal } from '@angular/core';
import { DataSourceError } from '../data/data-sources';
import { msg, Msg } from '../i18n/i18n.model';

export type SectionStatus = 'loading' | 'ready' | 'empty' | 'error';

/**
 * What a section of the screen needs to know about its data:
 *  · loading — nothing to show yet (skeleton)
 *  · ready   — data to show; `pending` while a newer request is in flight
 *  · empty   — the source has no data for this place (not an error)
 *  · error   — failed and nothing to fall back on
 * A failed refresh keeps the last good data and reports `error` alongside it.
 */
export interface SectionState<T> {
  readonly status: SectionStatus;
  readonly data: T | null;
  readonly pending: boolean;
  readonly error: Msg | null;
}

export function errorMessage(error: unknown): Msg {
  return error instanceof DataSourceError ? error.detail : msg('error.fallback');
}

/**
 * Wraps a resource so the last good value survives reloads and place switches
 * (stale-while-revalidate), and `isCurrent` tells whether it still matches.
 */
export function sectionState<T>(
  resource: ResourceRef<T | null | undefined>,
  isCurrent: (data: T) => boolean = () => true,
): Signal<SectionState<T>> {
  const lastGood = linkedSignal<T | null | undefined, { value: T | null } | undefined>({
    source: () => (resource.hasValue() ? resource.value() : undefined),
    computation: (value, previous) => (value !== undefined ? { value } : previous?.value),
  });

  return computed(() => {
    const status = resource.status();
    const last = lastGood();
    const loading = resource.isLoading();

    if (status === 'error') {
      const error = errorMessage(resource.error());
      return last?.value != null && isCurrent(last.value)
        ? { status: 'ready', data: last.value, pending: false, error }
        : { status: 'error', data: null, pending: false, error };
    }

    if (last === undefined) return { status: 'loading', data: null, pending: true, error: null };

    if (last.value === null) {
      return loading
        ? { status: 'loading', data: null, pending: true, error: null }
        : { status: 'empty', data: null, pending: false, error: null };
    }

    return {
      status: 'ready',
      data: last.value,
      pending: loading || !isCurrent(last.value),
      error: null,
    };
  });
}
