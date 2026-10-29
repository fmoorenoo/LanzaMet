/*
 * A headless Chrome driven over the DevTools protocol, with nothing to
 * install: Node's own fetch and WebSocket. For the scripts that need a real
 * browser (og-images.ts). Set CHROME to the browser's path if it isn't found.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const CANDIDATES = [
  process.env['CHROME'],
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

export interface Page {
  /** Sends one protocol command and waits for its answer. */
  send<T = Record<string, unknown>>(method: string, params?: object): Promise<T>;
  close(): Promise<void>;
}

export async function openPage(): Promise<Page> {
  const executable = CANDIDATES.find((path) => path && existsSync(path));
  if (!executable) throw new Error('No se encuentra Chrome: indica su ruta en CHROME.');
  const profile = mkdtempSync(join(tmpdir(), 'lanzamet-chrome-'));
  const chrome = spawn(
    executable,
    ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { stdio: 'ignore' },
  );

  // Chrome writes the port it chose into the profile.
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100);
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()) as {
    type: string;
    webSocketDebuggerUrl: string;
  }[];
  const target = targets.find((t) => t.type === 'page');
  if (!target) throw new Error('Chrome no ha abierto ninguna página.');

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data)) as {
      id?: number;
      result?: unknown;
      error?: { message: string };
    };
    const waiting = message.id === undefined ? undefined : pending.get(message.id);
    if (!waiting) return;
    pending.delete(message.id!);
    if (message.error) waiting.reject(new Error(message.error.message));
    else waiting.resolve(message.result);
  });

  return {
    send: <T>(method: string, params: object = {}) =>
      new Promise<T>((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
        socket.send(JSON.stringify({ id, method, params }));
      }),
    async close() {
      socket.close();
      chrome.kill();
      await sleep(300);
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    },
  };
}

/** Runs an expression in the page and returns its (awaited) value. */
export async function evaluate<T>(page: Page, expression: string): Promise<T> {
  const { result, exceptionDetails } = await page.send<{
    result: { value: T };
    exceptionDetails?: { text: string };
  }>('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (exceptionDetails) throw new Error(exceptionDetails.text);
  return result.value;
}
