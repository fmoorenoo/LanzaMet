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
import { DataSourceError } from '../data-sources';

const REQUEST_TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 1_500;

/** Worth one more try: the network blinked or the provider hiccuped. */
function isTransient(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) return false;
  return error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504;
}

/** A visitor-safe message for a failed request to `service`. */
export function toSourceError(error: unknown, service: string): DataSourceError {
  if (error instanceof DataSourceError) return error;
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return new DataSourceError(`No hay conexión con ${service}. Comprueba tu red.`);
    }
    if (error.status === 429) {
      return new DataSourceError(`${capitalise(service)} está saturado. Prueba en unos minutos.`);
    }
    if (error.status >= 500) {
      return new DataSourceError(`${capitalise(service)} no responde ahora mismo.`);
    }
  }
  if (error instanceof Error && error.name === 'TimeoutError') {
    return new DataSourceError(`${capitalise(service)} tarda demasiado en responder.`);
  }
  return new DataSourceError(`No hemos podido leer los datos de ${service}.`);
}

function capitalise(text: string): string {
  return text.charAt(0).toLocaleUpperCase('es-ES') + text.slice(1);
}

/** Timeout, a single delayed retry for transient failures, and a readable error. */
export function resilient<T>(service: string): MonoTypeOperatorFunction<T> {
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
