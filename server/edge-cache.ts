/*
 * A copy of each upstream answer shared by everyone, in two layers:
 *  · this isolate's memory (instant, but each Worker instance has its own), and
 *  · Cloudflare's Cache API (`caches.default`), shared by every instance in a
 *    data centre. Absent on Node and in tests, where only memory is used. It
 *    does nothing on *.workers.dev addresses: it needs the custom domain.
 * Simultaneous misses share one upstream request. A copy outlives its
 * freshness by `staleMs`, to be served (marked stale) only if the upstream fails.
 */

export interface Remembered {
  /** The upstream answer, as text (JSON). */
  readonly text: string;
  /** When the upstream answered (ms since epoch). */
  readonly storedAt: number;
  readonly stale: boolean;
}

export interface Freshness {
  readonly ttlMs: number;
  /** How long past `ttlMs` a copy is kept for when the upstream fails. */
  readonly staleMs: number;
}

/** Errors that must never be papered over with an old copy. */
export class NoFallback extends Error {}

interface Entry {
  readonly text: string;
  readonly storedAt: number;
}

/** Only a handful of distinct answers exist; this only stops a flood of odd ones. */
const MEMORY_LIMIT = 64;
const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<Entry>>();

/** Cache API keys must be URLs; this host never resolves, it only names entries. */
const CACHE_ORIGIN = 'https://edge-cache.que-tal-hoy.invalid/';

interface CacheLike {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

function edge(): CacheLike | null {
  const storage = (globalThis as { caches?: { default?: CacheLike } }).caches;
  return storage?.default ?? null;
}

const cacheKey = (key: string) => new Request(CACHE_ORIGIN + encodeURIComponent(key));

async function readEdge(key: string): Promise<Entry | null> {
  try {
    const hit = await edge()?.match(cacheKey(key));
    if (!hit) return null;
    const storedAt = Number(hit.headers.get('x-stored-at'));
    return Number.isFinite(storedAt) ? { text: await hit.text(), storedAt } : null;
  } catch {
    return null;
  }
}

async function writeEdge(key: string, entry: Entry, keepMs: number): Promise<void> {
  try {
    await edge()?.put(
      cacheKey(key),
      new Response(entry.text, {
        headers: {
          'content-type': 'application/json',
          'cache-control': `public, max-age=${Math.ceil(keepMs / 1000)}`,
          'x-stored-at': String(entry.storedAt),
        },
      }),
    );
  } catch {
    // The shared layer is a bonus: memory still holds the copy.
  }
}

function keep(key: string, entry: Entry): void {
  memory.delete(key);
  memory.set(key, entry);
  if (memory.size > MEMORY_LIMIT) memory.delete(memory.keys().next().value as string);
}

export async function remember(
  key: string,
  freshness: Freshness,
  load: () => Promise<string>,
): Promise<Remembered> {
  const now = Date.now();
  const fresh = (entry: Entry) => now - entry.storedAt < freshness.ttlMs;

  let known: Entry | null = memory.get(key) ?? null;
  if (known && fresh(known)) return { ...known, stale: false };
  const shared = await readEdge(key);
  if (shared && (!known || shared.storedAt > known.storedAt)) {
    known = shared;
    keep(key, shared);
  }
  if (known && fresh(known)) return { ...known, stale: false };

  try {
    let pending = inflight.get(key);
    if (!pending) {
      pending = load()
        .then(async (text) => {
          const entry = { text, storedAt: Date.now() };
          keep(key, entry);
          await writeEdge(key, entry, freshness.ttlMs + freshness.staleMs);
          return entry;
        })
        .finally(() => inflight.delete(key));
      inflight.set(key, pending);
    }
    return { ...(await pending), stale: false };
  } catch (error) {
    if (
      !(error instanceof NoFallback) &&
      known &&
      now - known.storedAt < freshness.ttlMs + freshness.staleMs
    ) {
      return { ...known, stale: true };
    }
    throw error;
  }
}

/** Tests only: start from an empty memory. */
export function forgetAll(): void {
  memory.clear();
  inflight.clear();
}
