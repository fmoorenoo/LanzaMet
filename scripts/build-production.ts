/*
 * Production build for Cloudflare:   npm run build:prod
 *
 * Reads from the environment, or from a local `.env` file (Git ignores it):
 *   WEB3FORMS_ACCESS_KEY  the Web3Forms key for «Ayúdanos» (required; see DEPLOYMENT.md)
 *   PUBLIC_URL            optional: the address shared links carry, e.g. https://quetalhoy.es
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
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = join(root, 'dist', 'que-tal-hoy', 'browser');
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
  fail('PUBLIC_URL debe ser solo el origen con https, p. ej. https://quetalhoy.es');
}

const defines = [
  ...(key ? ['--define', `QTH_WEB3FORMS_KEY='${key}'`] : []),
  ...(publicUrl ? ['--define', `QTH_PUBLIC_URL='${publicUrl}'`] : []),
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
]) {
  if (!existsSync(join(dir, file))) fail(`Falta ${file} en la build.`);
}
for (const file of ['.env', '.dev.vars']) {
  if (existsSync(join(dir, file))) fail(`${file} no debe publicarse.`);
}
const index = readFileSync(join(dir, 'index.html'), 'utf8');
if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(index)) {
  fail('index.html tiene un script en línea: la Content-Security-Policy lo bloquearía.');
}
const scripts = readdirSync(dir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => readFileSync(join(dir, name), 'utf8'))
  .join('\n');
// Only the demo build has the simulator and its controls.
for (const marker of ['qth-demo-controls', 'Puerto de Arrecife']) {
  if (scripts.includes(marker)) fail(`La build contiene código de la demo («${marker}»).`);
}
if (key && !scripts.includes(key)) fail('La clave de Web3Forms no ha llegado a la build.');

console.log('\n✓ Build de producción lista en dist/que-tal-hoy/browser');
console.log(`  Ayúdanos: ${key ? 'clave de Web3Forms incluida' : 'SIN clave (no enviará nada)'}`);
console.log(`  Enlace al compartir: ${publicUrl || 'la dirección desde la que se abra la web'}`);
