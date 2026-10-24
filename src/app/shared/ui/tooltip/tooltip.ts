import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';

/** Pause before a hovered control shows its label; none while another one is showing. */
const HOVER_DELAY_MS = 450;
/** Grace to cross the gap between the control and its label without losing it. */
const LEAVE_GRACE_MS = 120;
const GAP_PX = 8;
const EDGE_PX = 8;

/** Only one label is ever on screen: this closes the one showing. */
let closeShowing: (() => void) | null = null;

/**
 * The words behind an icon-only control, shown beside it when it is hovered
 * with a mouse or reached with the keyboard, in the interface's language.
 * The control keeps its own accessible name (`aria-label`); the label is
 * hidden from assistive tech, which already reads that name.
 *
 * WCAG 1.4.13: Escape dismisses it, the pointer can move onto it without it
 * going away, and it stays until hover or focus leave. It lives in the top
 * layer (popover), so no clipping parent can cut it. The native `title` is
 * left out on purpose: it would draw a second, unstyled bubble, late, and
 * never for keyboard or touch.
 */
@Directive({
  selector: '[lmTooltip]',
  host: {
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave()',
    '(focusin)': 'onFocus()',
    '(focusout)': 'hide()',
    '(click)': 'hide()',
  },
})
export class Tooltip {
  readonly text = input.required<string>({ alias: 'lmTooltip' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private bubble: HTMLElement | null = null;
  private showTimer: ReturnType<typeof setTimeout> | undefined;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.hide();
  };
  private readonly onScroll = () => this.hide();
  private readonly close = () => this.hide();

  constructor() {
    effect(() => {
      const text = this.text();
      if (this.bubble) this.bubble.textContent = text;
    });
    inject(DestroyRef).onDestroy(() => {
      this.hide();
      this.bubble?.remove();
    });
  }

  protected onPointerEnter(event: PointerEvent): void {
    clearTimeout(this.hideTimer);
    if (event.pointerType !== 'mouse' || this.isOpen()) return;
    clearTimeout(this.showTimer);
    this.showTimer = setTimeout(() => this.show(), closeShowing ? 0 : HOVER_DELAY_MS);
  }

  protected onPointerLeave(): void {
    clearTimeout(this.showTimer);
    this.hideTimer = setTimeout(() => this.hide(), LEAVE_GRACE_MS);
  }

  /** Keyboard focus only: a click or a tap focuses too, and needs no label. */
  protected onFocus(): void {
    if (this.host.matches(':focus-visible')) this.show();
  }

  hide(): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    if (!this.isOpen()) return;
    this.bubble?.hidePopover();
    this.document.removeEventListener('keydown', this.onKey, true);
    this.document.removeEventListener('scroll', this.onScroll, true);
    if (closeShowing === this.close) closeShowing = null;
  }

  private show(): void {
    const bubble = this.ensureBubble();
    if (!bubble || this.isOpen() || !this.text()) return;
    if (closeShowing && closeShowing !== this.close) closeShowing();
    closeShowing = this.close;
    bubble.showPopover();
    this.place(bubble);
    this.document.addEventListener('keydown', this.onKey, true);
    this.document.addEventListener('scroll', this.onScroll, true);
  }

  private isOpen(): boolean {
    return this.bubble?.matches(':popover-open') ?? false;
  }

  /**
   * A child of the control, so hovering it still counts as hovering the
   * control; drawn in the top layer, where the control's box does not reach.
   */
  private ensureBubble(): HTMLElement | null {
    if (this.bubble) return this.bubble;
    const bubble = this.document.createElement('span');
    if (typeof bubble.showPopover !== 'function') return null;
    bubble.popover = 'manual';
    bubble.className = 'tooltip-bubble';
    bubble.setAttribute('aria-hidden', 'true');
    bubble.textContent = this.text();
    // A click on the label is not a click on the control.
    bubble.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
    });
    this.host.append(bubble);
    this.bubble = bubble;
    return bubble;
  }

  /** Below the control, or above it near the bottom of the screen; never past an edge. */
  private place(bubble: HTMLElement): void {
    const anchor = this.host.getBoundingClientRect();
    const box = bubble.getBoundingClientRect();
    const view = this.document.documentElement;
    const below = anchor.bottom + GAP_PX + box.height <= view.clientHeight - EDGE_PX;
    const top = below ? anchor.bottom + GAP_PX : anchor.top - GAP_PX - box.height;
    const centre = anchor.left + anchor.width / 2 - box.width / 2;
    const left = Math.min(Math.max(EDGE_PX, centre), view.clientWidth - EDGE_PX - box.width);
    bubble.dataset['side'] = below ? 'below' : 'above';
    bubble.style.left = `${Math.round(left)}px`;
    bubble.style.top = `${Math.round(top)}px`;
  }
}
