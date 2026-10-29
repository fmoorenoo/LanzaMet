/*
 * Production build for Cloudflare:   npm run build:prod
 *
 * Reads from the environment, or from a local `.env` file (Git ignores it):
 *   WEB3FORMS_ACCESS_KEY  the Web3Forms key for «Ayúdanos» (required; see DEPLOYMENT.md)
 *   PUBLIC_URL            optional: the address shared links carry, e.g. https://lanzamet.com
 * and passes them to the Angular build with --define. No shell is involved,
 * so it behaves the same in PowerShell, cmd, bash and Cloudflare's builder.
 *
 * Then it checks the output before anything can be deployed: the service
 * worker and headers are there, no inline script slipped in (the CSP forbids
 * them), no simulated data shipped, and the key really is inside.
 *
 *   --allow-without-feedback   build without a key («Ayúdanos» then says sending
 *                              isn't set up); for local checks only.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = join(root, 'dist', 'lanzamet', 'browser');
const allowWithoutFeedback = process.argv.includes('--allow-without-feedback');

try {
  process.loadEnvFile(join(root, '.env'));
} catch {
  // No local file: the environment (or Cloudflare's build settings) provides the values.
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const key = process.env['WEB3FORMS_ACCESS_KEY']?.trim() ?? '';
const publicUrl = process.env['PUBLIC_URL']?.trim().replace(/\/+$/, '') ?? '';

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

if (key && !UUID.test(key))
  fail('WEB3FORMS_ACCESS_KEY no tiene forma de clave de Web3Forms (un UUID).');
if (!key && !allowWithoutFeedback) {
  fail(
    'Falta WEB3FORMS_ACCESS_KEY: sin ella «Ayúdanos» no envía nada.\n' +
      '  Ponla en un archivo .env en la raíz (WEB3FORMS_ACCESS_KEY=…) o en las variables de build de Cloudflare.\n' +
      '  Para una prueba local sin envío: npm run build:prod -- --allow-without-feedback',
  );
}
if (publicUrl && !/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(publicUrl)) {
  fail('PUBLIC_URL debe ser solo el origen con https, p. ej. https://lanzamet.com');
}

const defines = [
  ...(key ? ['--define', `LM_WEB3FORMS_KEY='${key}'`] : []),
  ...(publicUrl ? ['--define', `LM_PUBLIC_URL='${publicUrl}'`] : []),
];
const ng = join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const build = spawnSync(
  process.execPath,
  [ng, 'build', '--configuration', 'production', ...defines],
  {
    cwd: root,
    stdio: 'inherit',
  },
);
if (build.status !== 0) fail('La build de Angular ha fallado.');

// ── Checks on what would be deployed ─────────────────────────────────────
for (const file of [
  'index.html',
  'ngsw-worker.js',
  'ngsw.json',
  'manifest.webmanifest',
  '_headers',
  'install-prompt.js',
  'robots.txt',
  '_redirects',
]) {
  if (!existsSync(join(dir, file))) fail(`Falta ${file} en la build.`);
}
for (const file of ['.env', '.dev.vars']) {
  if (existsSync(join(dir, file))) fail(`${file} no debe publicarse.`);
}
// ── Prerendered pages (see src/app/app.routes.server.ts) ────────────────
// Unknown addresses get the app's empty shell with a 404 (notFoundPage in
// server/api.ts), and the service worker opens it offline (ngsw-config.json).
if (!existsSync(join(dir, 'index.csr.html'))) {
  fail('Falta index.csr.html (la página vacía de la app) en la build.');
}

const prerendered = Object.keys(
  (
    JSON.parse(readFileSync(join(dir, '..', 'prerendered-routes.json'), 'utf8')) as {
      routes: Record<string, unknown>;
    }
  ).routes,
);
if (prerendered.length < 2) fail('No se ha prerenderizado ninguna página.');
/** Indexable pages, for the sitemap written below. */
const indexed: string[] = [];
/** Each indexable page's language versions (hreflang → address), checked both ways below. */
const versions = new Map<string, Record<string, string>>();
const ORIGIN = 'https://lanzamet.com';
/** English under /en, Spanish everywhere else (src/app/core/i18n/localized-paths.ts). */
const langOf = (route: string) => (/^\/en(?:[/?#]|$)/.test(route) ? 'en' : 'es');

for (const route of prerendered) {
  const file = route === '/' ? 'index.html' : `${route.slice(1)}/index.html`;
  if (!existsSync(join(dir, file))) fail(`Falta la página prerenderizada ${file}.`);
  const html = readFileSync(join(dir, file), 'utf8');
  // A retired place's address: a redirect page (public/_redirects answers it with a 301 first).
  if (/<meta http-equiv="refresh"/.test(html)) continue;
  // Data blocks (application/json, ld+json) don't run; anything else would.
  if (/<script(?![^>]*\bsrc=)(?![^>]*type="application\/(?:ld\+)?json")[^>]*>/i.test(html)) {
    fail(`${file} tiene un script en línea: la Content-Security-Policy lo bloquearía.`);
  }
  const lang = langOf(route);
  if (!new RegExp(`<html[^>]*\\blang="${lang}"`).test(html)) {
    fail(`${file} no está en su idioma (<html lang="${lang}">).`);
  }
  // Every link inside the site stays in the page's language; only the way to
  // the other language (marked with hreflang) leaves it.
  for (const [anchor, href] of html.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)"[^>]*>/g)) {
    if (langOf(href) !== lang && !/\bhreflang=/.test(anchor)) {
      fail(`${file} enlaza ${href}, que está en otro idioma.`);
    }
  }
  // Pages are written at build time: no visitor's language suggestion, no weather of that moment.
  if (html.includes('language-suggestion')) fail(`${file} lleva la sugerencia de idioma.`);
  if (/id="current-temperature"/.test(html))
    fail(`${file} lleva datos del tiempo del momento del build.`);
  const indexable = !/<meta name="robots" content="noindex"/.test(html);
  if (indexable) {
    if (!html.includes(`<link rel="canonical" href="${ORIGIN}${route === '/' ? '/' : route}">`)) {
      fail(`${file} no lleva su dirección canónica.`);
    }
    indexed.push(route);
    // Its version in each language, itself among them, and Spanish for everyone else.
    const alternates: Record<string, string> = {};
    for (const [, hreflang, href] of html.matchAll(
      /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g,
    )) {
      alternates[hreflang] = href;
    }
    if (Object.keys(alternates).sort().join() !== 'en,es,x-default') {
      fail(`${file} no lleva sus versiones es, en y x-default (hreflang).`);
    }
    if (alternates[lang] !== `${ORIGIN}${route}`) {
      fail(`${file} no se nombra a sí misma entre sus versiones (hreflang).`);
    }
    if (alternates['x-default'] !== alternates['es']) {
      fail(`${file}: x-default no es la versión en español.`);
    }
    versions.set(route, alternates);
    // The link preview's picture exists, and the structured data is valid JSON.
    const image = /<meta property="og:image" content="https:\/\/lanzamet\.com\/([^"]+)"/.exec(html);
    if (!image) fail(`${file} no lleva imagen para compartir (og:image).`);
    if (!existsSync(join(dir, image[1])))
      fail(`${file} enlaza ${image[1]}, que no está en la build.`);
    const ld = /<script id="structured-data" type="application\/ld\+json">([^<]*)<\/script>/.exec(
      html,
    );
    if (!ld) fail(`${file} no lleva datos estructurados (JSON-LD).`);
    try {
      JSON.parse(ld[1]);
    } catch {
      fail(`Los datos estructurados de ${file} no son JSON válido.`);
    }
  }
}
// ── hreflang: each version names the others, and they name it back ──────
for (const [route, alternates] of versions) {
  for (const [hreflang, href] of Object.entries(alternates)) {
    const other = href.slice(ORIGIN.length) || '/';
    const back = versions.get(other);
    if (!back)
      fail(`${route} da como versión ${hreflang} ${href}, que no es una página indexable.`);
    if (JSON.stringify(back) !== JSON.stringify(alternates)) {
      fail(`${route} y ${other} no se nombran entre sí igual (hreflang).`);
    }
  }
}

// ── Sitemap: every prerendered page that may be indexed, and only those ──
// No <lastmod>: the weather on them changes every hour, their text rarely,
// and a date that always says "today" is one search engines learn to ignore.
// The language versions are named in each page's <head> (hreflang), not here
// as well. Spanish first, then English, each in the same order.
const ORDER: Record<string, string[]> = {
  es: ['/', '/zonas', '/mar', '/donde-ir', '/tiempo/', '/mar/', '/sobre', '/legal'],
  en: [
    '/en',
    '/en/places',
    '/en/sea',
    '/en/where-to-go',
    '/en/weather/',
    '/en/sea/',
    '/en/about',
    '/en/legal',
  ],
};
const rank = (route: string) => {
  const lang = langOf(route);
  const order = ORDER[lang];
  const i = order.findIndex((p) =>
    p.endsWith('/') && p !== '/' ? route.startsWith(p) : route === p,
  );
  return (lang === 'es' ? 0 : order.length + 1) + (i === -1 ? order.length : i);
};
indexed.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
const urls = indexed.map((route) => `  <url><loc>${ORIGIN}${route}</loc></url>`);
writeFileSync(
  join(dir, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n'),
);

const scripts = readdirSync(dir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => readFileSync(join(dir, name), 'utf8'))
  .join('\n');
// Only the demo build has the simulator and its controls.
for (const marker of ['lm-demo-controls', 'Puerto de Arrecife']) {
  if (scripts.includes(marker)) fail(`La build contiene código de la demo («${marker}»).`);
}
if (key && !scripts.includes(key)) fail('La clave de Web3Forms no ha llegado a la build.');

console.log('\n✓ Build de producción lista en dist/lanzamet/browser');
const inEnglish = indexed.filter((route) => langOf(route) === 'en').length;
console.log(`  Páginas prerenderizadas: ${prerendered.length}; en el sitemap: ${indexed.length}`);
console.log(`    en español: ${indexed.length - inEnglish}; en inglés: ${inEnglish}`);
console.log(`  Ayúdanos: ${key ? 'clave de Web3Forms incluida' : 'SIN clave (no enviará nada)'}`);
console.log(`  Enlace al compartir: ${publicUrl || 'la dirección desde la que se abra la web'}`);
