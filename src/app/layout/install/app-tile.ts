import { Component, input } from '@angular/core';
import { Icon } from '../../shared/ui/icon/icon';
import { BrandMark } from '../brand-mark/brand-mark';

/**
 * The app's icon as it sits on a home screen, and, once installed, a check
 * that grows onto its corner: the one moment of this feature that moves.
 */
@Component({
  selector: 'qth-app-tile',
  imports: [BrandMark, Icon],
  template: `
    <qth-brand-mark />
    @if (installed()) {
      <span class="badge"><qth-icon name="check" /></span>
    }
  `,
  host: { class: 'app-tile', 'aria-hidden': 'true' },
  styles: `
    :host {
      --tile: 2.75rem;
      position: relative;
      display: block;
      flex: none;
      width: var(--tile);
      height: var(--tile);
    }

    qth-brand-mark {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 1px 1px oklch(0.2 0.02 250 / 0.12))
        drop-shadow(0 4px 10px oklch(0.2 0.02 250 / 0.12));
    }

    .badge {
      position: absolute;
      right: -0.3rem;
      bottom: -0.3rem;
      display: grid;
      place-items: center;
      width: max(1.25rem, calc(var(--tile) * 0.36));
      aspect-ratio: 1;
      border-radius: var(--r-pill);
      background-color: var(--c-accent);
      color: var(--c-accent-ink);
      box-shadow: 0 0 0 2px var(--c-surface);
      transition:
        transform 280ms var(--ease-out),
        opacity 180ms ease;

      @starting-style {
        opacity: 0;
        transform: scale(0.6);
      }

      qth-icon {
        width: 70%;
        height: 70%;
        stroke-width: 2.5;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .badge {
        transition: opacity 180ms ease;

        @starting-style {
          opacity: 0;
          transform: none;
        }
      }
    }
  `,
})
export class AppTile {
  readonly installed = input(false);
}
