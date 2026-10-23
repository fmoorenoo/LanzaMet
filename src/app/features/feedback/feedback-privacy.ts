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

/** What is sent, who receives it and what "anonymous" does and doesn't mean. */
@Component({
  selector: 'qth-feedback-privacy',
  imports: [Icon, TranslatePipe],
  template: `
    <h2 id="feedback-privacy-title" class="title">
      <qth-icon name="privacy" />{{ 'feedback.privacy' | t }}
    </h2>
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
  `,
  host: {
    class: 'feedback-privacy',
    role: 'region',
    'aria-labelledby': 'feedback-privacy-title',
  },
  styles: `
    :host {
      display: grid;
      gap: var(--s-3);
      align-content: start;
    }
    .title {
      display: flex;
      align-items: center;
      gap: var(--s-2);
      font-size: var(--fs-body);
      font-weight: 640;
      letter-spacing: -0.01em;

      qth-icon {
        width: var(--icon-sm);
        height: var(--icon-sm);
        color: var(--c-ink-2);
      }
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
  `,
})
export class FeedbackPrivacy {
  protected readonly points = POINTS;
}
