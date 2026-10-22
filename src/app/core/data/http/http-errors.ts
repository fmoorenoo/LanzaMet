import { HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  MonoTypeOperatorFunction,
  Observable,
  retry,
  throwError,
  timeout,
  timer,
} from 'rxjs';
import { MessageKey, msg } from '../../i18n/i18n.model';
import { DataSourceError } from '../data-sources';

const REQUEST_TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 1_500;

/** Worth one more try: the network blinked or the provider hiccuped. */
function isTransient(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) return false;
  return error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504;
}

/** A visitor-safe message for a failed request to `service` (a "service.*" message). */
export function toSourceError(error: unknown, service: MessageKey): DataSourceError {
  if (error instanceof DataSourceError) return error;
  const params = { service: msg(service) };
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return new DataSourceError(msg('error.offline', params));
    if (error.status === 429) return new DataSourceError(msg('error.busy', params));
    if (error.status >= 500) return new DataSourceError(msg('error.down', params));
  }
  if (error instanceof Error && error.name === 'TimeoutError') {
    return new DataSourceError(msg('error.timeout', params));
  }
  return new DataSourceError(msg('error.unreadable', params));
}

/** Timeout, a single delayed retry for transient failures, and a readable error. */
export function resilient<T>(service: MessageKey): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    source.pipe(
      timeout({ first: REQUEST_TIMEOUT_MS }),
      retry({
        count: 1,
        delay: (error: unknown) =>
          isTransient(error) ? timer(RETRY_DELAY_MS) : throwError(() => error),
      }),
      catchError((error: unknown) => throwError(() => toSourceError(error, service))),
    );
}
