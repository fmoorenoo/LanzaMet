import { Component } from '@angular/core';
import { MessageKey } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { Icon } from '../../shared/ui/icon/icon';

const POINTS: readonly MessageKey[] = [
  'feedback.privacy.what',
  'feedback.privacy.who',
  'feedback.privacy.technical',
  'feedback.privacy.use',
  'feedback.privacy.content',
  'feedback.privacy.device',
  'feedback.privacy.erase',
];

/**
 * What is sent and who receives it, folded behind one discreet line under the
 * form: always a click away, never in the way of writing.
 */
@Component({
  selector: 'lm-feedback-privacy',
  imports: [Icon, TranslatePipe],
  template: `
    <details class="details">
      <summary id="feedback-privacy-toggle" class="summary">
        <lm-icon class="shield" name="privacy" />
        <span class="summary-text">{{ 'feedback.privacy' | t }}</span>
        <lm-icon class="chevron" name="chevron-down" />
      </summary>
      <div class="body">
        <ul class="points">
          @for (point of points; track point) {
            <li class="t-small">{{ point | t: { provider: 'Web3Forms' } }}</li>
          }
        </ul>
        <a
          id="feedback-provider-privacy"
          class="t-small provider-link"
          href="https://web3forms.com/privacy"
          target="_blank"
          rel="noopener"
          >{{ 'feedback.privacy.providerLink' | t }}</a
        >
      </div>
    </details>
  `,
  host: { class: 'feedback-privacy' },
  styles: `
    :host {
      display: block;
    }
    .summary {
      display: inline-flex;
      align-items: center;
      gap: var(--s-2);
      min-height: 2.75rem;
      border-radius: var(--r-sm);
      color: var(--c-ink-2);
      font-size: var(--fs-small);
      font-weight: 560;
      list-style: none;
      cursor: pointer;
      transition: color var(--d-fast) ease;

      &::-webkit-details-marker {
        display: none;
      }

      lm-icon {
        width: var(--icon-sm);
        height: var(--icon-sm);
        flex: none;
      }
    }
    .summary-text {
      text-decoration: underline;
      text-decoration-color: var(--c-line-strong);
      text-decoration-thickness: 1px;
      text-underline-offset: 0.25em;
    }
    .chevron {
      transition: transform var(--d-base) var(--ease-out);

      .details[open] & {
        transform: rotate(180deg);
      }
    }
    .body {
      display: grid;
      gap: var(--s-3);
      padding-bottom: var(--s-2);
      animation: lm-rise 240ms var(--ease-out) both;
    }
    .points {
      display: grid;
    }
    li {
      padding-block: var(--s-3);
      color: var(--c-ink-2);
      text-wrap: pretty;
    }
    li + li {
      border-top: 1px solid var(--c-line);
    }
    .provider-link {
      justify-self: start;
      color: var(--c-accent);
      font-weight: 600;
    }
    @media (hover: hover) and (pointer: fine) {
      .summary:hover {
        color: var(--c-ink);
      }
      .summary:hover .summary-text {
        text-decoration-color: currentColor;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .chevron {
        transition: none;
      }
      .body {
        animation-name: lm-fade-in;
      }
    }
  `,
})
export class FeedbackPrivacy {
  protected readonly points = POINTS;
}
