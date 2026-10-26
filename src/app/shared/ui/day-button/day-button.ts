import { Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { DayStore } from '../../../core/state/day.store';
import { UiStore } from '../../../layout/ui.store';
import { Icon } from '../icon/icon';

/**
 * The day on screen ("Hoy", "Mañana", "Miércoles"), which opens the week to
 * choose another. `sky` sits on the hero's scene and takes its ink, like the
 * buttons beside it; `chip` sits on a page, like the place chip on Mar. A
 * day other than today is marked, so it is never mistaken for now.
 */
@Component({
  selector: 'lm-day-button',
  imports: [Icon, TranslatePipe],
  host: { class: 'day-button-host' },
  template: `
    <button
      #button
      type="button"
      class="day-button"
      [class.chip]="variant() === 'chip'"
      [class.is-sky]="variant() === 'sky'"
      [class.is-later]="!day.isToday()"
      [attr.id]="buttonId()"
      aria-haspopup="dialog"
      (click)="ui.openDayPicker()"
    >
      <lm-icon class="calendar" name="calendar" />
      <span class="label">{{ day.label() | t }}</span>
      <lm-icon class="chevron" name="chevron-down" />
      <span class="visually-hidden">{{ 'dayPicker.change' | t }}</span>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      min-width: 0;
    }

    .day-button {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      min-width: 0;
      white-space: nowrap;
      transition:
        transform var(--d-press) var(--ease-out),
        background-color var(--d-fast) ease,
        border-color var(--d-fast) ease;

      &:active {
        transform: scale(0.97);
      }
    }

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .calendar,
    .chevron {
      flex: none;
      width: var(--icon-sm);
      height: var(--icon-sm);
    }

    // On the scene: a pill in the sky's own ink, like share and settings.
    .is-sky {
      height: 2.25rem;
      padding: 0 0.75rem 0 0.625rem;
      border-radius: var(--r-pill);
      color: inherit;
      background-color: color-mix(in oklch, currentColor 9%, transparent);
      border: 1px solid color-mix(in oklch, currentColor 26%, transparent);
      font-size: var(--fs-small);
      font-weight: 640;

      .chevron {
        opacity: 0.75;
      }

      &:focus-visible {
        outline-color: currentColor;
      }

      // A later day: the pill fills in, so the sky clearly isn't now.
      &.is-later {
        background-color: color-mix(in oklch, currentColor 20%, transparent);
        border-color: color-mix(in oklch, currentColor 44%, transparent);
      }
    }

    // On a page: the chip, with the accent once a later day is chosen.
    .chip.is-later {
      border-color: var(--c-accent);
      background-color: var(--c-accent-soft);
      color: var(--c-ink);

      .calendar {
        color: var(--c-accent);
      }
    }

    // The narrowest phones: the day's name matters more than the icon beside it.
    @media (max-width: 23rem) {
      .is-sky {
        gap: 0.25rem;
        padding: 0 0.5rem 0 0.625rem;

        .calendar {
          display: none;
        }
      }
    }

    @media (hover: hover) and (pointer: fine) {
      .is-sky:hover {
        background-color: color-mix(in oklch, currentColor 24%, transparent);
      }
    }

    // A 44 px target on touch screens, without the pill looking any bigger.
    @media (pointer: coarse) {
      .day-button {
        position: relative;

        &::after {
          content: '';
          position: absolute;
          inset: min(0px, calc((100% - 2.75rem) / 2)) 0;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .day-button {
        transition: none;
      }
    }
  `,
})
export class DayButton {
  readonly variant = input<'sky' | 'chip'>('chip');
  readonly buttonId = input<string | null>(null);

  protected readonly ui = inject(UiStore);
  protected readonly day = inject(DayStore);

  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('button');

  /** Brings focus to the button, without scrolling the page to it. */
  focus(): void {
    this.button().nativeElement.focus({ preventScroll: true });
  }
}
