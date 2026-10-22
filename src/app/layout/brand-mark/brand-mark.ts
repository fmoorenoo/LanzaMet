import { Component } from '@angular/core';

/** The sun setting into the Atlantic, drawn as the brand's mark. */
@Component({
  selector: 'qth-brand-mark',
  template: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect class="tile" width="32" height="32" rx="10" />
      <circle class="sun" cx="16" cy="16.5" r="6.5" />
      <path
        class="sea"
        d="M0 19.5c2.7 0 3.3-1.8 6-1.8s3.3 1.8 6 1.8 3.3-1.8 6-1.8 3.3 1.8 6 1.8 3.3-1.8 6-1.8 2 .9 2 .9V32H0z"
      />
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      width: 2rem;
      height: 2rem;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
      border-radius: 31%;
      overflow: hidden;
    }
    .tile {
      fill: var(--atlantico-700);
    }
    .sun {
      fill: var(--sol-400);
    }
    .sea {
      fill: var(--atlantico-500);
    }
  `,
})
export class BrandMark {}
