import { Component, computed, input } from '@angular/core';
import { IconName, ICONS } from './icons';

/**
 * Decorative by default; give it a `label` when it carries meaning on its own.
 *
 * Sizing follows the role of the icon (`--icon-xs` … `--icon-xl` in the
 * tokens); colour is always the text colour around it, and the stroke is the
 * same 1.75 for every icon, Lucide's and the app's own.
 */
@Component({
  selector: 'qth-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      [class.is-filled]="filled()"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.role]="label() ? 'img' : null"
    >
      @if (label(); as text) {
        <svg:title>{{ text }}</svg:title>
      }
      @for (shape of shapes(); track $index) {
        @let a = shape[1];
        @switch (shape[0]) {
          @case ('path') {
            <svg:path [attr.d]="a['d']" />
          }
          @case ('circle') {
            <svg:circle [attr.cx]="a['cx']" [attr.cy]="a['cy']" [attr.r]="a['r']" />
          }
          @case ('line') {
            <svg:line
              [attr.x1]="a['x1']"
              [attr.y1]="a['y1']"
              [attr.x2]="a['x2']"
              [attr.y2]="a['y2']"
            />
          }
          @case ('rect') {
            <svg:rect
              [attr.x]="a['x']"
              [attr.y]="a['y']"
              [attr.width]="a['width']"
              [attr.height]="a['height']"
              [attr.rx]="a['rx']"
              [attr.ry]="a['ry']"
            />
          }
          @case ('polyline') {
            <svg:polyline [attr.points]="a['points']" />
          }
          @case ('polygon') {
            <svg:polygon [attr.points]="a['points']" />
          }
          @case ('ellipse') {
            <svg:ellipse
              [attr.cx]="a['cx']"
              [attr.cy]="a['cy']"
              [attr.rx]="a['rx']"
              [attr.ry]="a['ry']"
            />
          }
        }
      }
    </svg>
  `,
  host: { class: 'icon', '[attr.data-icon]': 'name()' },
  styles: `
    :host {
      display: inline-block;
      width: var(--icon-xl);
      height: var(--icon-xl);
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
    .is-filled {
      fill: currentColor;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly label = input<string>();

  private readonly definition = computed(() => ICONS[this.name()]);
  protected readonly shapes = computed(() => this.definition().shapes);
  protected readonly filled = computed(() => 'filled' in this.definition());
}
