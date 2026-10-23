import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { Tooltip } from '../tooltip/tooltip';
import { HorizontalScroll } from './horizontal-scroll';

/**
 * Previous / next buttons for a horizontal scroller, for mouse and keyboard
 * users. They only appear with a fine pointer and while the content
 * overflows; each one is disabled once its end is reached.
 */
@Component({
  selector: 'qth-scroll-controls',
  imports: [Icon, Tooltip],
  template: `
    <button
      type="button"
      class="scroll-button"
      data-direction="back"
      [disabled]="!scroller().canScrollBack()"
      [attr.aria-controls]="scroller().id"
      [attr.aria-label]="backLabel()"
      [qthTooltip]="backLabel()"
      (click)="scroller().scrollPage(-1)"
    >
      <qth-icon name="chevron-left" />
    </button>
    <button
      type="button"
      class="scroll-button"
      data-direction="forward"
      [disabled]="!scroller().canScrollForward()"
      [attr.aria-controls]="scroller().id"
      [attr.aria-label]="forwardLabel()"
      [qthTooltip]="forwardLabel()"
      (click)="scroller().scrollPage(1)"
    >
      <qth-icon name="chevron-right" />
    </button>
  `,
  host: {
    class: 'scroll-controls',
    '[class.is-needed]': 'scroller().overflowing()',
  },
  styles: `
    :host {
      display: none;
      gap: var(--s-1);
    }

    // Touch screens swipe; the buttons are for a mouse and a keyboard.
    @media (hover: hover) and (pointer: fine) {
      :host(.is-needed) {
        display: inline-flex;
      }
    }

    .scroll-button {
      display: grid;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--r-pill);
      color: inherit;
      background-color: color-mix(in oklch, currentColor 7%, transparent);
      transition:
        background-color var(--d-fast) ease,
        opacity var(--d-fast) ease,
        transform var(--d-press) var(--ease-out);

      &:active:not(:disabled) {
        transform: scale(0.94);
      }

      &:hover:not(:disabled) {
        background-color: color-mix(in oklch, currentColor 14%, transparent);
      }

      &:disabled {
        opacity: 0.35;
        cursor: default;
      }

      qth-icon {
        width: var(--icon-md);
        height: var(--icon-md);
      }
    }
  `,
})
export class ScrollControls {
  readonly scroller = input.required<HorizontalScroll>();
  readonly backLabel = input.required<string>();
  readonly forwardLabel = input.required<string>();
}
