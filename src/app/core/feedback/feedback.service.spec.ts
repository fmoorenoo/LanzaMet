import { TestBed } from '@angular/core/testing';
import { FeedbackTransport } from './feedback-transport';
import { FeedbackDraft, FeedbackError, FeedbackSubmission } from './feedback.model';
import { FeedbackService } from './feedback.service';

class FakeTransport extends FeedbackTransport {
  configured = true;
  readonly sent: FeedbackSubmission[] = [];
  next: () => Promise<void> = () => Promise.resolve();

  send(submission: FeedbackSubmission): Promise<void> {
    this.sent.push(submission);
    return this.next();
  }
}

const NOW = Date.UTC(2026, 9, 23, 12);

const draft = (overrides: Partial<FeedbackDraft> = {}): FeedbackDraft => ({
  kind: 'suggestion',
  message: '  Una tabla de mareas para Playa Blanca.  ',
  email: '',
  honeypot: '',
  startedAt: NOW - 60_000,
  ...overrides,
});

function setup(configured = true): { service: FeedbackService; transport: FakeTransport } {
  const transport = new FakeTransport();
  transport.configured = configured;
  TestBed.configureTestingModule({
    providers: [{ provide: FeedbackTransport, useValue: transport }],
  });
  return { service: TestBed.inject(FeedbackService), transport };
}

async function reason(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof FeedbackError ? error.reason : 'unexpected';
  }
}

describe('FeedbackService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lm.lang', JSON.stringify('es'));
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('sends no email when the visitor left none', async () => {
    const { service, transport } = setup();
    await service.send(draft({ email: '   ' }));
    expect(transport.sent[0]).toEqual({
      kind: 'suggestion',
      message: 'Una tabla de mareas para Playa Blanca.',
      lang: 'es',
      email: null,
    });
  });

  it('sends the email, trimmed, when the visitor chose to leave it', async () => {
    const { service, transport } = setup();
    await service.send(draft({ email: ' ana@example.com ' }));
    expect(transport.sent[0].email).toBe('ana@example.com');
  });

  it('sends nothing when the honeypot is filled or sending is not set up', async () => {
    const { service, transport } = setup();
    expect(await reason(service.send(draft({ honeypot: 'http://spam' })))).toBe('rejected');
    expect(transport.sent).toHaveLength(0);

    TestBed.resetTestingModule();
    const unconfigured = setup(false);
    expect(await reason(unconfigured.service.send(draft()))).toBe('not-configured');
    expect(unconfigured.transport.sent).toHaveLength(0);
  });

  it('remembers a delivered message, across reloads, to refuse it twice', async () => {
    const { service, transport } = setup();
    await service.send(draft());
    expect(localStorage.getItem('lm.feedback')).not.toContain('Playa');

    vi.setSystemTime(NOW + 5 * 60_000);
    TestBed.resetTestingModule();
    const reloaded = setup();
    expect(await reason(reloaded.service.send(draft({ startedAt: NOW })))).toBe('duplicate');
    expect(transport.sent).toHaveLength(1);
    expect(reloaded.transport.sent).toHaveLength(0);
  });

  it('does not count a failed delivery', async () => {
    const { service, transport } = setup();
    transport.next = () => Promise.reject(new FeedbackError('unavailable'));
    expect(await reason(service.send(draft()))).toBe('unavailable');
    transport.next = () => Promise.resolve();
    expect(await reason(service.send(draft()))).toBeNull();
    expect(transport.sent).toHaveLength(2);
  });

  it('joins a second send while the first is on its way', async () => {
    const { service, transport } = setup();
    let finish!: () => void;
    transport.next = () => new Promise<void>((resolve) => (finish = resolve));
    const first = service.send(draft());
    const second = service.send(draft());
    await Promise.resolve();
    finish();
    await Promise.all([first, second]);
    expect(transport.sent).toHaveLength(1);
  });
});
