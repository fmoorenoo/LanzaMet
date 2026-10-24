import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, describe, it, mock } from 'node:test';
import { handle } from './api.ts';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url));
const rss = fixture('canarias-rss-20261022.xml');
const archive = fixture('canarias-20261022T003734Z.tar.gz');

/** AEMET as it answered on 22 Oct 2026, or failing on demand. */
function aemet(state: { down: boolean }) {
  return mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input);
    if (state.down) return new Response('busy', { status: 503 });
    if (url.endsWith('_RSS.xml')) return new Response(rss);
    if (url.endsWith('.tar.gz')) return new Response(archive);
    return new Response('not found', { status: 404 });
  });
}

const get = (path: string, env = {}) => handle(new Request(`http://localhost/api${path}`), env);

describe('API', () => {
  afterEach(() => mock.restoreAll());

  it('serves Lanzarote warnings with the service marker, for its own site only', async () => {
    const fetchMock = aemet({ down: false });
    const response = await get('/avisos');
    assert.equal(response.status, 200);
    // Same origin as the site: no CORS unless another origin is configured.
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body['service'], 'lanzamet-api');
    assert.ok(Array.isArray(body['warnings']));
    assert.equal(body['publishedAt'], '2026-10-22T00:37:34.000Z');
    assert.equal(body['stale'], false);
    assert.equal(fetchMock.mock.callCount(), 2);

    // A second visitor within ten minutes costs AEMET nothing.
    await get('/avisos');
    assert.equal(fetchMock.mock.callCount(), 2);
  });

  it('says observations are not configured without an AEMET key', async () => {
    const response = await get('/observaciones');
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      service: 'lanzamet-api',
      error: 'not_configured',
    });
  });

  it('is not an open proxy', async () => {
    assert.equal((await get('/https://example.com')).status, 404);
    const post = await handle(new Request('http://localhost/api/avisos', { method: 'POST' }), {});
    assert.equal(post.status, 405);
  });

  it('opens CORS only to the configured origin', async () => {
    aemet({ down: false });
    const response = await get('/avisos', { ALLOWED_ORIGIN: 'https://example.org' });
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://example.org');
    const preflight = await handle(
      new Request('http://localhost/api/avisos', { method: 'OPTIONS' }),
      {},
    );
    assert.equal(preflight.headers.get('access-control-allow-origin'), null);
  });

  it('reports the key without revealing it', async () => {
    const body = (await (await get('/salud', { AEMET_API_KEY: 'secret' })).json()) as object;
    assert.deepEqual(body, { service: 'lanzamet-api', ok: true, aemetKey: true });
  });

  it('answers 502 when AEMET fails and nothing is cached', async () => {
    aemet({ down: true });
    // Observations have never been loaded in this process: nothing to fall back on.
    const response = await get('/observaciones', { AEMET_API_KEY: 'k' });
    assert.equal(response.status, 502);
  });

  // Runs last: it fills the in-memory cache that the test above must not see.
  it('asks OpenData station by station and keeps those that answer', async () => {
    const station = fixture('aemet-C029O-20261022.json');
    const fetchMock = mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.endsWith('/estacion/C029O')) {
        return Response.json({ estado: 200, datos: 'https://opendata.aemet.es/opendata/sh/x' });
      }
      if (url.includes('/estacion/')) return Response.json({ estado: 404 }, { status: 404 });
      if (url.endsWith('/sh/x')) return new Response(station);
      return new Response('?', { status: 500 });
    });
    const response = await get('/observaciones', { AEMET_API_KEY: 'k' });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { observations: { stationId: string }[] };
    assert.deepEqual(
      body.observations.map((o) => o.stationId),
      ['C029O'],
    );
    // Seven stations, plus the data file of the one that had data.
    assert.equal(fetchMock.mock.callCount(), 8);
  });
});
