import { createServer } from 'node:http';
import { handle, type Env } from './api.ts';

/*
 * Runs the API on Node (24+, which runs TypeScript directly) for local
 * development or any Node host. `ng serve` forwards /api here (proxy.conf.json).
 *
 *   npm run api                                   → http://localhost:8787/api/avisos
 *
 * Local secrets go in `.dev.vars` at the project root (one `AEMET_API_KEY=…`
 * line), which Git ignores and `wrangler dev` (npm run preview) also reads.
 * `server/.dev.vars`, the older place, still works. Variables already set in
 * the environment take precedence.
 */

for (const file of ['../.dev.vars', './.dev.vars']) {
  try {
    process.loadEnvFile(new URL(file, import.meta.url));
  } catch {
    // No local secrets there: observations stay "not configured".
  }
}

const port = Number(process.env['PORT'] ?? 8787);
const env: Env = {
  AEMET_API_KEY: process.env['AEMET_API_KEY'] || undefined,
  ALLOWED_ORIGIN: process.env['ALLOWED_ORIGIN'] || undefined,
};

createServer(async (req, res) => {
  const request = new Request(`http://localhost:${port}${req.url ?? '/'}`, {
    method: req.method,
  });
  const response = await handle(request, env);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, () => {
  console.log(`API de LanzaMet en http://localhost:${port}/api`);
  console.log(`Clave de AEMET OpenData: ${env.AEMET_API_KEY ? 'configurada' : 'no configurada'}`);
});
