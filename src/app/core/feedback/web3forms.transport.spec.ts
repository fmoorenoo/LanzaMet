import { TestBed } from '@angular/core/testing';
import { FeedbackError, FeedbackSubmission } from './feedback.model';
import { WEB3FORMS_ACCESS_KEY, Web3FormsTransport } from './web3forms.transport';

// A made-up key: the network is stubbed, nothing reaches Web3Forms.
const KEY = '00000000-0000-4000-8000-000000000000';

const ANONYMOUS: FeedbackSubmission = {
  kind: 'bug',
  message: 'La marea de Famara no cuadra.',
  lang: 'es',
  email: null,
};

function transport(key: string | null = KEY): Web3FormsTransport {
  TestBed.configureTestingModule({
    providers: [Web3FormsTransport, { provide: WEB3FORMS_ACCESS_KEY, useValue: key }],
  });
  return TestBed.inject(Web3FormsTransport);
}

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function reason(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof FeedbackError ? error.reason : 'unexpected';
  }
}

describe('Web3FormsTransport', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('has no key unless the build defines a valid one', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(WEB3FORMS_ACCESS_KEY)).toBeNull();
  });

  it('without a key, says so and sends nothing', async () => {
    const t = transport(null);
    expect(t.configured).toBe(false);
    expect(await reason(t.send(ANONYMOUS))).toBe('not-configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves only on an explicit success, sending just what is needed', async () => {
    fetchMock.mockResolvedValue(reply(200, { success: true, body: { message: 'Email sent' } }));
    await transport().send(ANONYMOUS);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.web3forms.com/submit');
    expect(init.credentials).toBe('omit');
    expect(init.referrerPolicy).toBe('no-referrer');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toEqual({
      access_key: KEY,
      subject: '¿Qué tal hoy? · Error',
      from_name: '¿Qué tal hoy?',
      tipo: 'Error',
      mensaje: 'La marea de Famara no cuadra.',
      idioma: 'Español',
      respuesta: 'Sin correo de contacto',
      botcheck: false,
    });
  });

  it('includes the email only when there is one', async () => {
    fetchMock.mockResolvedValue(reply(200, { success: true }));
    await transport().send({ ...ANONYMOUS, email: 'ana@example.com', lang: 'en' });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.email).toBe('ana@example.com');
    expect(body.idioma).toBe('Inglés');
    expect(body).not.toHaveProperty('respuesta');
  });

  it('never treats an unconfirmed answer as sent', async () => {
    fetchMock.mockResolvedValue(reply(200, { success: false }));
    expect(await reason(transport().send(ANONYMOUS))).toBe('unavailable');
  });

  it('maps provider failures to reasons the visitor can act on', async () => {
    const t = transport();
    fetchMock.mockResolvedValueOnce(reply(429, { success: false, message: 'Too may requests' }));
    expect(await reason(t.send(ANONYMOUS))).toBe('rate-limited');
    fetchMock.mockResolvedValueOnce(reply(400, { success: false, body: { message: 'Spam' } }));
    expect(await reason(t.send(ANONYMOUS))).toBe('rejected');
    fetchMock.mockResolvedValueOnce(reply(500, { statusCode: 500, error: 'Something went wrong' }));
    expect(await reason(t.send(ANONYMOUS))).toBe('unavailable');
    fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 200 }));
    expect(await reason(t.send(ANONYMOUS))).toBe('unavailable');
  });

  it('tells a lost connection from a slow one', async () => {
    const t = transport();
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await reason(t.send(ANONYMOUS))).toBe('offline');
    fetchMock.mockRejectedValueOnce(new DOMException('Timed out', 'TimeoutError'));
    expect(await reason(t.send(ANONYMOUS))).toBe('timeout');
  });
});
