import {
  decodeLatin1,
  fullStateArchiveUrl,
  gunzip,
  islandObservations,
  LANZAROTE_STATIONS,
  LANZAROTE_ZONES,
  rssPublishedAt,
  untar,
  warningsFromArchive,
} from './aemet.ts';

/*
 * The app's own small API. It exists for two reasons only:
 *  · AEMET's warning files can't be read from a browser (no CORS), and
 *  · AEMET OpenData needs a private key that must never reach the browser.
 * It answers a fixed set of routes (it is not an open proxy) and keeps each
 * answer in memory for a few minutes, so AEMET sees a handful of requests an
 * hour however many people use the app.
 *
 * Standard Fetch handler: runs as a Cloudflare Worker (`export default`),
 * on Deno, or on Node through `dev.ts`.
 */

export interface Env {
  /** AEMET OpenData key (https://opendata.aemet.es/centrodedescargas/altaUsuario). */
  readonly AEMET_API_KEY?: string;
  /** Origin allowed to call the API; `*` by default (the data is public). */
  readonly ALLOWED_ORIGIN?: string;
}

const SERVICE = 'que-tal-hoy-api';
const CANARIAS_WARNINGS_RSS =
  'https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAC65_RSS.xml';
const OPENDATA = 'https://opendata.aemet.es/opendata/api';
const USER_AGENT = 'que-tal-hoy/1.0';

const MINUTE = 60_000;
const WARNINGS_TTL = 10 * MINUTE;
const OBSERVATIONS_TTL = 20 * MINUTE;
/** If AEMET fails, a copy younger than this is still served (and marked as such). */
const STALE_LIMIT = 2 * 60 * MINUTE;
const UPSTREAM_TIMEOUT = 15_000;

interface CacheEntry {
  readonly body: Record<string, unknown>;
  readonly storedAt: number;
}

const memory = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<Record<string, unknown>>>();

class UpstreamError extends Error {}
class NotConfiguredError extends Error {}

async function fetchUpstream(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { 'user-agent': USER_AGENT, ...init?.headers },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
  });
  if (!response.ok) throw new UpstreamError(`${url} → HTTP ${response.status}`);
  return response;
}

async function loadWarnings(now: Date): Promise<Record<string, unknown>> {
  const rss = await (await fetchUpstream(CANARIAS_WARNINGS_RSS)).text();
  const archiveUrl = fullStateArchiveUrl(rss);
  if (!archiveUrl) throw new UpstreamError('El RSS de avisos no enlaza el estado completo');
  const archive = new Uint8Array(await (await fetchUpstream(archiveUrl)).arrayBuffer());
  const files = untar(await gunzip(archive));
  return {
    warnings: warningsFromArchive(files, LANZAROTE_ZONES, now),
    publishedAt: rssPublishedAt(rss),
    source: archiveUrl,
  };
}

/**
 * OpenData answers in two steps: a pointer to the data, then the data.
 * Null when OpenData has nothing for the request (its own 404).
 */
async function openData(path: string, key: string): Promise<unknown[] | null> {
  const response = await fetch(`${OPENDATA}/${path}`, {
    headers: { api_key: key, 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
  });
  const pointer = (await response.json().catch(() => ({}))) as {
    estado?: number;
    datos?: string;
    descripcion?: string;
  };
  if (pointer.estado === 404) return null;
  if (pointer.estado !== 200 || !pointer.datos) {
    const status = pointer.estado ?? response.status;
    throw new UpstreamError(`AEMET OpenData ${path}: ${status} ${pointer.descripcion ?? ''}`);
  }
  const bytes = new Uint8Array(await (await fetchUpstream(pointer.datos)).arrayBuffer());
  const data: unknown = JSON.parse(decodeLatin1(bytes));
  return Array.isArray(data) ? data : null;
}

/** OpenData throttles bursts: ask for a few stations at a time. */
const STATIONS_AT_ONCE = 3;

async function loadObservations(env: Env): Promise<Record<string, unknown>> {
  const key = env.AEMET_API_KEY;
  if (!key) throw new NotConfiguredError();
  const records: unknown[] = [];
  const failures: unknown[] = [];
  for (let i = 0; i < LANZAROTE_STATIONS.length; i += STATIONS_AT_ONCE) {
    const batch = await Promise.allSettled(
      LANZAROTE_STATIONS.slice(i, i + STATIONS_AT_ONCE).map((id) =>
        openData(`observacion/convencional/datos/estacion/${id}`, key),
      ),
    );
    for (const result of batch) {
      if (result.status === 'fulfilled') records.push(...(result.value ?? []));
      else failures.push(result.reason);
    }
  }
  // A station that skips an hour is normal; every station failing is an outage.
  if (records.length === 0 && failures.length > 0) throw failures[0];
  return { observations: islandObservations(records) };
}

async function cached(
  key: string,
  ttl: number,
  load: () => Promise<Record<string, unknown>>,
): Promise<{ body: Record<string, unknown>; stale: boolean }> {
  const now = Date.now();
  const hit = memory.get(key);
  if (hit && now - hit.storedAt < ttl) return { body: hit.body, stale: false };
  try {
    let pending = inflight.get(key);
    if (!pending) {
      pending = load().finally(() => inflight.delete(key));
      inflight.set(key, pending);
    }
    const body = { ...(await pending), retrievedAt: new Date().toISOString() };
    memory.set(key, { body, storedAt: Date.now() });
    return { body, stale: false };
  } catch (error) {
    if (!(error instanceof NotConfiguredError) && hit && now - hit.storedAt < STALE_LIMIT) {
      return { body: hit.body, stale: true };
    }
    throw error;
  }
}

function json(body: Record<string, unknown>, status: number, env: Env, maxAge = 0): Response {
  return new Response(JSON.stringify({ service: SERVICE, ...body }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': maxAge > 0 ? `public, max-age=${maxAge}` : 'no-store',
      'access-control-allow-origin': env.ALLOWED_ORIGIN ?? '*',
      vary: 'origin',
    },
  });
}

export async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': env.ALLOWED_ORIGIN ?? '*',
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-max-age': '86400',
      },
    });
  }
  if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, env);

  const route = url.pathname.replace(/\/+$/, '').replace(/^\/api/, '');
  try {
    switch (route) {
      case '/avisos': {
        const { body, stale } = await cached('avisos', WARNINGS_TTL, () =>
          loadWarnings(new Date()),
        );
        return json({ ...body, stale }, 200, env, 300);
      }
      case '/observaciones': {
        const { body, stale } = await cached('observaciones', OBSERVATIONS_TTL, () =>
          loadObservations(env),
        );
        return json({ ...body, stale }, 200, env, 600);
      }
      case '/salud':
        return json({ ok: true, aemetKey: Boolean(env.AEMET_API_KEY) }, 200, env);
      default:
        return json({ error: 'not_found' }, 404, env);
    }
  } catch (error) {
    if (error instanceof NotConfiguredError) return json({ error: 'not_configured' }, 503, env);
    console.error('[api]', route, error);
    return json({ error: 'upstream' }, 502, env);
  }
}

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
};
