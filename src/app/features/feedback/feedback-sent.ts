import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { msg } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { Icon } from '../../shared/ui/icon/icon';
import { FeedbackReceipt } from './feedback-form/feedback-form';

/**
 * The provider confirmed receipt. The check draws itself once — the page's
 * one authored moment — and focus moves to the heading so it is announced.
 */
@Component({
  selector: 'qth-feedback-sent',
  imports: [Icon, TranslatePipe],
  template: `
    <svg class="seal" viewBox="0 0 64 64" aria-hidden="true">
      <circle class="seal-disc" cx="32" cy="32" r="30" />
      <path class="seal-check" d="M20 33.5l8 8 16.5-18" pathLength="1" />
    </svg>
    <h2 #heading id="feedback-sent-title" class="t-title" tabindex="-1">
      {{ 'feedback.sent' | t }}
    </h2>
    <p class="t-body t-muted text">{{ text() | t }}</p>
    <button id="feedback-again" type="button" class="btn again" (click)="again.emit()">
      <qth-icon name="feedback" />{{ 'feedback.sent.again' | t }}
    </button>
  `,
  host: {
    id: 'feedback-sent',
    class: 'feedback-sent enter-settle',
    role: 'region',
    'aria-labelledby': 'feedback-sent-title',
  },
  styles: `
    :host {
      display: grid;
      justify-items: start;
      gap: var(--s-3);
      padding: var(--s-6);
      border: 1px solid var(--c-line);
      border-radius: var(--r-lg);
      background-color: var(--c-surface);
    }
    .seal {
      width: 4rem;
      height: 4rem;
      margin-bottom: var(--s-2);
      overflow: visible;
    }
    .seal-disc {
      fill: var(--c-accent-soft);
      transform-origin: center;
      animation: seal-in 420ms var(--ease-out) both;
    }
    .seal-check {
      fill: none;
      stroke: var(--c-accent);
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 1;
      animation: check-draw 380ms var(--ease-out) 160ms both;
    }
    h2 {
      outline: none;
    }
    .text {
      max-width: 44ch;
    }
    .again {
      margin-top: var(--s-3);
    }
    @keyframes seal-in {
      from {
        opacity: 0;
        transform: scale(0.85);
      }
    }
    @keyframes check-draw {
      from {
        stroke-dashoffset: 1;
      }
      to {
        stroke-dashoffset: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .seal-disc {
        animation-name: qth-fade-in;
      }
      .seal-check {
        animation: none;
      }
    }
  `,
})
export class FeedbackSent {
  readonly receipt = input.required<FeedbackReceipt>();
  readonly again = output<void>();

  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly text = computed(() => {
    const { email } = this.receipt();
    return email ? msg('feedback.sent.withEmail', { email }) : msg('feedback.sent.noEmail');
  });

  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus());
  }
}
