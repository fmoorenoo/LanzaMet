import { inject, Injectable, InjectionToken } from '@angular/core';
import { FeedbackTransport } from './feedback-transport';
import { FeedbackError, FeedbackKind, FeedbackSubmission } from './feedback.model';

/*
 * Web3Forms (https://web3forms.com) turns a POST into an email to the
 * address the access key was created for. Its docs: the key "can be public"
 * (it can only send to that one inbox), the API is meant to be called from
 * the browser (server-side calls need a paid plan and an allowlisted IP),
 * every submission goes through their spam filter, and `botcheck` is their
 * honeypot field. The free plan covers 250 submissions a month.
 *
 * The key is never written in the source: it is passed at build time
 *   ng build --define "LM_WEB3FORMS_KEY='your-access-key'"
 * and without it the form says sending is not set up, and sends nothing.
 */

declare const LM_WEB3FORMS_KEY: string | undefined;

const ENDPOINT = 'https://api.web3forms.com/submit';
const TIMEOUT_MS = 15_000;
/** Access keys are UUIDs; anything else is a typo or a placeholder. */
const ACCESS_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const WEB3FORMS_ACCESS_KEY = new InjectionToken<string | null>('WEB3FORMS_ACCESS_KEY', {
  factory: () => {
    const key = typeof LM_WEB3FORMS_KEY === 'string' ? LM_WEB3FORMS_KEY.trim() : '';
    return ACCESS_KEY.test(key) ? key : null;
  },
});

/** The email is read by the team, in Spanish, whatever language the visitor used. */
const KIND_LABEL: Readonly<Record<FeedbackKind, string>> = {
  bug: 'Error',
  suggestion: 'Sugerencia',
  improvement: 'Mejora',
  other: 'Otro',
};

interface Web3FormsReply {
  readonly success?: unknown;
}

@Injectable()
export class Web3FormsTransport extends FeedbackTransport {
  private readonly accessKey = inject(WEB3FORMS_ACCESS_KEY);

  readonly configured = this.accessKey !== null;

  async send(submission: FeedbackSubmission): Promise<void> {
    if (!this.accessKey) throw new FeedbackError('not-configured');
    if (globalThis.navigator?.onLine === false) throw new FeedbackError('offline');

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(this.payload(this.accessKey, submission)),
        // No cookies or referrer: the provider learns nothing about the page.
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
      throw new FeedbackError(timedOut ? 'timeout' : 'offline');
    }

    if (response.status === 429) throw new FeedbackError('rate-limited');
    if (response.status >= 500) throw new FeedbackError('unavailable');

    const reply = await response.json().catch((): Web3FormsReply => ({}));
    // Only an explicit success is a receipt; anything else did not arrive.
    if (response.ok && reply.success === true) return;
    throw new FeedbackError(response.status >= 400 ? 'rejected' : 'unavailable');
  }

  private payload(accessKey: string, submission: FeedbackSubmission): Record<string, unknown> {
    const kind = KIND_LABEL[submission.kind];
    return {
      access_key: accessKey,
      subject: `LanzaMet · ${kind}`,
      from_name: 'LanzaMet',
      tipo: kind,
      mensaje: submission.message,
      idioma: submission.lang === 'es' ? 'Español' : 'Inglés',
      // `email` also becomes the reply-to address; it is absent when none was left.
      ...(submission.email ? { email: submission.email } : { respuesta: 'Sin correo de contacto' }),
      botcheck: false,
    };
  }
}
