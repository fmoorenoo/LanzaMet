import { Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

/** Inline empty or error state: names the problem and, if possible, the way out. */
@Component({
  selector: 'qth-status-message',
  imports: [Icon],
  template: `
    <qth-icon class="mark" [name]="icon()" />
    <div class="copy">
      <p class="t-body t-strong">{{ title() }}</p>
      @if (text()) {
        <p class="t-small t-muted">{{ text() }}</p>
      }
      @if (actionLabel()) {
        <button type="button" class="btn btn--quiet action" (click)="action.emit()">
          @if (tone() === 'error') {
            <qth-icon name="refresh" />
          }
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  host: {
    class: 'status-message',
    '[attr.data-tone]': 'tone()',
    '[attr.role]': "tone() === 'error' ? 'alert' : 'status'",
    '[class.is-error]': "tone() === 'error'",
  },
  styles: `
    :host {
      display: flex;
      gap: var(--s-3);
      align-items: flex-start;
      padding: var(--s-4);
      border-radius: var(--r-md);
      background-color: var(--c-surface-sunken);
    }
    .mark {
      width: var(--icon-lg);
      height: var(--icon-lg);
      color: var(--c-ink-3);
      margin-top: 1px;
    }
    :host(.is-error) .mark {
      color: var(--c-poor);
    }
    .copy {
      display: grid;
      gap: var(--s-1);
      justify-items: start;
    }
    .action {
      margin-top: var(--s-1);
      margin-left: calc(var(--s-3) * -1);
      min-height: 2.5rem;
    }
  `,
})
export class StatusMessage {
  readonly tone = input<'empty' | 'error'>('empty');
  readonly title = input.required<string>();
  readonly text = input<string | null>(null);
  readonly actionLabel = input<string | null>(null);
  readonly icon = input<IconName>('info');
  readonly action = output<void>();
}
