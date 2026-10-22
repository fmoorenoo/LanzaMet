import { Component, computed, input } from '@angular/core';
import { IconName, IconPath, ICONS } from './icons';

/** Decorative by default; give it a `label` when it carries meaning on its own. */
@Component({
  selector: 'qth-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.role]="label() ? 'img' : null"
    >
      @if (label(); as text) {
        <svg:title>{{ text }}</svg:title>
      }
      @for (path of paths(); track $index) {
        <svg:path [attr.d]="path.d" [class.fill]="path.fill" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      width: 1.5rem;
      height: 1.5rem;
      flex: none;
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.75;
      stroke-linecap: round;
      stroke-linejoin: round;
      overflow: visible;
    }
    .fill {
      fill: currentColor;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly label = input<string>();

  protected readonly paths = computed<readonly IconPath[]>(() => ICONS[this.name()]);
}
