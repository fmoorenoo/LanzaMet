import { Component, computed, inject, input } from '@angular/core';
import { webcamFor } from '../../../core/data/webcams';
import { I18n } from '../../../core/i18n/i18n.store';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { LocationId } from '../../../core/models';
import { LocationsStore } from '../../../core/state/locations.store';
import { Icon } from '../icon/icon';

/**
 * "En directo": a link to the public live camera of a place, on its own
 * website, with a camera mark and a red live dot. Renders nothing for a
 * place without one, so it can be dropped anywhere a place is named.
 *
 * `chip`: a pill on a surface (lists, the map's card). `overlay`: a dark
 * pill over a landscape (the mini scenes). `inline`: words in a sentence
 * ("Ver Playa Grande en directo"), for the facts of the day.
 */
@Component({
  selector: 'lm-webcam-link',
  imports: [Icon, TranslatePipe],
  template: `
    @if (cam(); as cam) {
      <a
        class="link webcam-link"
        [href]="cam.href"
        target="_blank"
        rel="noopener noreferrer"
        [attr.data-location-id]="locationId()"
      >
        <span class="dot" aria-hidden="true"></span>
        <lm-icon name="camera" />
        <span class="text">{{ label() | t }}</span>
        <span class="visually-hidden">{{
          'webcam.detail' | t: { view: cam.view, provider: cam.provider, place: cam.place }
        }}</span>
      </a>
    }
  `,
  host: {
    class: 'webcam',
    '[class.is-chip]': "variant() === 'chip'",
    '[class.is-overlay]': "variant() === 'overlay'",
    '[class.is-inline]': "variant() === 'inline'",
    '[style.display]': "cam() ? null : 'none'",
  },
  styles: `
    :host {
      --live: oklch(0.62 0.21 28);
      display: inline-flex;
      max-width: 100%;
    }

    .link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      min-width: 0;
      text-decoration: none;
      white-space: nowrap;
      transition:
        transform var(--d-press) var(--ease-out),
        background-color var(--d-fast) ease,
        border-color var(--d-fast) ease,
        color var(--d-fast) ease;

      &:active {
        transform: scale(0.97);
      }

      lm-icon {
        width: var(--icon-sm);
        height: var(--icon-sm);
      }
    }

    // The red light of a camera that is on; it breathes, slowly.
    .dot {
      flex: none;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background-color: var(--live);
      box-shadow: 0 0 0 0.1875rem color-mix(in oklch, var(--live) 28%, transparent);
      animation: webcam-breathe 2.4s ease-in-out infinite;
    }

    @keyframes webcam-breathe {
      50% {
        box-shadow: 0 0 0 0.3125rem color-mix(in oklch, var(--live) 12%, transparent);
      }
    }

    .text {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    // ── On a surface: a pill like the other chips (a host may set --chip-h
    // to line it up with a button beside it) ────────────────────
    :host(.is-chip) .link {
      flex: 1;
      justify-content: center;
      min-height: var(--chip-h, 2.25rem);
      padding: 0 var(--s-3) 0 0.625rem;
      border-radius: var(--r-pill);
      border: 1px solid var(--c-line-strong);
      background-color: var(--c-surface);
      color: var(--c-ink);
      font-size: var(--fs-small);
      font-weight: 600;
    }

    // ── Over a landscape: dark glass, light words, small ──────
    :host(.is-overlay) .link {
      min-height: 1.625rem;
      padding: 0 0.5rem 0 0.4375rem;
      border-radius: var(--r-pill);
      border: 1px solid oklch(1 0 0 / 0.18);
      background-color: oklch(0.16 0.03 262 / 0.62);
      color: oklch(0.98 0.005 90);
      font-size: 0.6875rem;
      font-weight: 650;
      letter-spacing: 0.01em;

      lm-icon {
        width: 0.875rem;
        height: 0.875rem;
      }

      .dot {
        width: 0.4375rem;
        height: 0.4375rem;
      }
    }

    // ── In a sentence: the red light and the words; the row's own label
    // already carries the camera mark.
    :host(.is-inline) .link {
      color: var(--c-accent);
      font-weight: 600;
      white-space: normal;
      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: 0.2em;

      lm-icon {
        display: none;
      }

      .text {
        overflow: visible;
      }
    }

    @media (hover: hover) and (pointer: fine) {
      :host(.is-chip) .link:hover {
        border-color: var(--c-ink-3);
      }

      :host(.is-overlay) .link:hover {
        background-color: oklch(0.16 0.03 262 / 0.8);
      }
    }

    // A finger's height on touch screens, without looking taller.
    @media (pointer: coarse) {
      :host(.is-chip) .link,
      :host(.is-overlay) .link {
        position: relative;

        &::after {
          content: '';
          position: absolute;
          inset: min(0px, calc((100% - 2.75rem) / 2)) 0;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .dot {
        animation: none;
      }
    }
  `,
})
export class WebcamLink {
  readonly locationId = input.required<LocationId>();
  readonly variant = input<'chip' | 'overlay' | 'inline'>('chip');

  private readonly i18n = inject(I18n);
  private readonly locations = inject(LocationsStore);

  protected readonly cam = computed(() => {
    const id = this.locationId();
    const cam = webcamFor(id);
    if (!cam) return null;
    return {
      href: cam.url[this.i18n.lang()],
      view: cam.view,
      provider: cam.provider,
      place: this.locations.byId(id)?.name ?? id,
    };
  });

  protected readonly label = computed(() =>
    this.variant() === 'inline'
      ? { key: 'webcam.watch' as const, params: { view: this.cam()?.view ?? '' } }
      : { key: 'webcam.live' as const },
  );
}
