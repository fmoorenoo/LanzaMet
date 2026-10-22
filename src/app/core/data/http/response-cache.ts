import { inject, Service, untracked } from '@angular/core';
import { defer, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { DataRefreshStore } from '../../state/data-refresh.store';
import { readStored, writeStored } from '../../utils/storage';

/*
 * One copy of each provider response for the whole app.
 *
 * Every store asks for the same few island-wide responses (the forecast for
 * all places, the sea for all places…). This cache makes sure that becomes
 * one request per response and per freshness window, shared by everyone who
 * asks at the same time, and that a reload of the page within that window
 * costs no request at all. Providers' free tiers stay untouched however many
 * components render the data.
 */

export interface CachePolicy {
  /** How long a response is reused before asking the provider again. */
  readonly ttlMs: number;
  /** Keep a copy in browser storage so a reload within the TTL is free. */
  readonly persist: boolean;
}

export interface Cached<T> {
  readonly value: T;
  /** When the provider actually answered (not when the cache did). */
  readonly fetchedAt: Date;
}

interface Entry {
  readonly key: string;
  readonly identity: string;
  readonly value: unknown;
  readonly fetchedAt: number;
  readonly generation: number;
}

/** A manual refresh only re-asks for responses older than this. */
const MIN_REVALIDATE_MS = 60_000;
const STORAGE_PREFIX = 'cache.';

const isEntry = (value: unknown): value is Entry =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Entry).key === 'string' &&
  typeof (value as Entry).identity === 'string' &&
  typeof (value as Entry).fetchedAt === 'number';

@Service()
export class ResponseCache {
  private readonly refresh = inject(DataRefreshStore);
  private readonly entries = new Map<string, Entry>();
  private readonly inflight = new Map<string, Observable<Entry>>();

  /**
   * The response for `key`, from memory, storage or a single shared request.
   * `identity` describes exactly what is asked (usually the URL): a stored
   * copy made for a different question is ignored.
   */
  get<T>(
    key: string,
    identity: string,
    request: () => Observable<T>,
    policy: CachePolicy,
  ): Observable<Cached<T>> {
    return defer(() => {
      const generation = untracked(this.refresh.version);
      const known = this.lookup(key, identity, policy, generation);
      if (known && this.isFresh(known, generation, policy)) return of(this.unwrap<T>(known));

      let shared = this.inflight.get(key);
      if (!shared) {
        shared = request().pipe(
          map((value): Entry => ({ key, identity, value, fetchedAt: Date.now(), generation })),
          tap((entry) => this.store(entry, policy)),
          finalize(() => this.inflight.delete(key)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
        this.inflight.set(key, shared);
      }
      return shared.pipe(map((entry) => this.unwrap<T>(entry)));
    });
  }

  private isFresh(entry: Entry, generation: number, policy: CachePolicy): boolean {
    const age = Date.now() - entry.fetchedAt;
    if (age < 0 || age >= policy.ttlMs) return false;
    // "Actualizar" asks again, unless the copy is barely a minute old.
    return entry.generation >= generation || age < MIN_REVALIDATE_MS;
  }

  private lookup(
    key: string,
    identity: string,
    policy: CachePolicy,
    generation: number,
  ): Entry | null {
    const inMemory = this.entries.get(key);
    if (inMemory?.identity === identity) return inMemory;
    if (!policy.persist) return null;
    const stored = readStored(STORAGE_PREFIX + key, isEntry);
    if (stored?.identity !== identity) return null;
    // A copy from an earlier visit counts as fresh until the visitor asks to refresh.
    const entry = { ...stored, generation };
    this.entries.set(key, entry);
    return entry;
  }

  private store(entry: Entry, policy: CachePolicy): void {
    this.entries.set(entry.key, entry);
    if (policy.persist) writeStored(STORAGE_PREFIX + entry.key, entry);
  }

  private unwrap<T>(entry: Entry): Cached<T> {
    return { value: entry.value as T, fetchedAt: new Date(entry.fetchedAt) };
  }
}
