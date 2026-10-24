import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { readStored, writeStored } from '../utils/storage';

/*
 * After a deploy, a page opened before it may ask for a lazy screen whose file
 * no longer exists (each build names its files by their content). The host
 * then answers with the page itself instead of JavaScript, and the import
 * fails. One reload fetches the new version; installed copies rarely get here,
 * because the service worker keeps the files of the version they run.
 */

/** What browsers say when a dynamic import can't be loaded or isn't JavaScript. */
const FAILED_IMPORT =
  /dynamically imported module|Importing a module script failed|module script|Loading chunk/i;

/** A second failure this soon means reloading won't help: stop, don't loop. */
const GUARD_MS = 30_000;
const STORAGE_KEY = 'reloadedForVersion';

export function isStaleChunkError(error: unknown): boolean {
  return error instanceof Error && FAILED_IMPORT.test(error.message);
}

/** Reloads once for a missing lazy file. True when it did. Call in an injection context. */
export function reloadForNewVersion(error: unknown, now = Date.now()): boolean {
  if (!isStaleChunkError(error)) return false;
  const last = readStored(STORAGE_KEY, (v): v is number => typeof v === 'number');
  if (last !== null && now - last < GUARD_MS) return false;
  writeStored(STORAGE_KEY, now);
  inject(DOCUMENT).defaultView?.location.reload();
  return true;
}
