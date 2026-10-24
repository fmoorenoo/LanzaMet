import { NgOptimizedImage } from '@angular/common';
import { booleanAttribute, Component, input } from '@angular/core';

/**
 * The sun setting behind the mountain, over the sea: the brand's mark.
 * It floats on the page by day; by night, and wherever it stands for the
 * app's icon (`tile`), it sits on the icon's light tile, since its dark
 * mountain would sink into a dark ground.
 */
@Component({
  selector: 'lm-brand-mark',
  imports: [NgOptimizedImage],
  template: `<img ngSrc="icons/logo.png" width="288" height="172" alt="" />`,
  host: { '[class.is-tile]': 'tile()' },
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      flex: none;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    /* The ground of the app's icon (see the README's "Manifest e iconos"). */
    :host(.is-tile),
    :host-context([data-theme='dark']) {
      border-radius: 22.5%;
      background-image: linear-gradient(oklch(1 0 0), oklch(0.95 0.012 215));

      img {
        width: 80%;
      }
    }
  `,
})
export class BrandMark {
  /** Always on its tile, as the icon on a home screen. */
  readonly tile = input(false, { transform: booleanAttribute });
}
