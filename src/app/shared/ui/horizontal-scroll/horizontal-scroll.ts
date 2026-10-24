import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  signal,
} from '@angular/core';

let nextId = 0;

/** A press that moves less than this is a click, not a drag. */
const DRAG_THRESHOLD_PX = 5;
/** A pause this long before letting go means the hand had stopped: no momentum. */
const STALE_MOVE_MS = 80;
/** How far a release is projected, in ms of its own speed (a soft flick, not a throw). */
const PROJECTION_MS = 220;
const GLIDE_MIN_MS = 240;
const GLIDE_MAX_MS = 480;

/** Emil Kowalski's strong ease-out, close to `--ease-out` in the tokens. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 5);

/**
 * Makes a horizontal scroller comfortable with a mouse, without taking
 * anything away from touch:
 *  · the edges fade while there is more to see in that direction;
 *  · it can be dragged with the mouse (a short press is still a click). On
 *    release it carries on with the hand's speed and eases to a stop where
 *    that speed was taking it, with no snapping to pull it elsewhere;
 *  · `scrollPage()` drives previous/next buttons (see ScrollControls).
 * Horizontal wheels, trackpads and Shift + wheel scroll it natively. A plain
 * vertical wheel is left to the page on purpose: hijacking it would trap the
 * page's scroll whenever the pointer crosses the strip.
 */
@Directive({
  selector: '[lmHorizontalScroll]',
  exportAs: 'horizontalScroll',
  host: {
    class: 'h-scroll',
    '[class.can-scroll-back]': 'canScrollBack()',
    '[class.can-scroll-forward]': 'canScrollForward()',
    '[class.is-dragging]': 'dragging()',
    '(scroll)': 'measure()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
    '(wheel)': 'stopGlide()',
    '(dragstart)': '$event.preventDefault()',
  },
})
export class HorizontalScroll {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly canScrollBack = signal(false);
  readonly canScrollForward = signal(false);
  readonly overflowing = computed(() => this.canScrollBack() || this.canScrollForward());
  protected readonly dragging = signal(false);

  /** The scroller's id, for `aria-controls` on the buttons that move it. */
  readonly id: string;

  private press: {
    pointerId: number;
    startX: number;
    startScroll: number;
    lastX: number;
    lastTime: number;
    velocity: number;
  } | null = null;
  private frame: number | null = null;

  constructor() {
    const element = this.host.nativeElement;
    element.id ||= `lm-scroller-${nextId++}`;
    this.id = element.id;

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // Content and container both change size (hours load, the window resizes).
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(element);
      Array.from(element.children).forEach((child) => observer.observe(child));
      this.measure();
      destroyRef.onDestroy(() => observer.disconnect());
    });
    destroyRef.onDestroy(() => this.stopGlide());
  }

  measure(): void {
    const el = this.host.nativeElement;
    const max = el.scrollWidth - el.clientWidth;
    this.canScrollBack.set(el.scrollLeft > 1);
    this.canScrollForward.set(el.scrollLeft < max - 1);
  }

  /** Moves by most of a screenful, leaving a little of the previous view as context. */
  scrollPage(direction: -1 | 1): void {
    this.stopGlide();
    const el = this.host.nativeElement;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: this.behavior() });
  }

  /** Interrupts the glide after a drag, leaving the strip where it is. */
  stopGlide(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  protected onPointerDown(event: PointerEvent): void {
    // Any new touch, pen or click catches a strip that is still gliding.
    this.stopGlide();
    // Touch and pens already scroll natively; only the mouse needs help.
    if (event.pointerType !== 'mouse' || event.button !== 0 || this.press) return;
    if (!this.overflowing()) return;
    const el = this.host.nativeElement;
    this.press = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: el.scrollLeft,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
    };
  }

  protected onPointerMove(event: PointerEvent): void {
    const press = this.press;
    if (!press || event.pointerId !== press.pointerId) return;
    const dx = event.clientX - press.startX;
    if (!this.dragging()) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      this.dragging.set(true);
      this.host.nativeElement.setPointerCapture(event.pointerId);
      // A drag is never a text selection, even one begun before the threshold.
      document.getSelection()?.removeAllRanges();
    }
    const dt = Math.max(1, event.timeStamp - press.lastTime);
    // Smoothed, so one jittery event doesn't decide the throw.
    press.velocity = 0.7 * ((event.clientX - press.lastX) / dt) + 0.3 * press.velocity;
    press.lastX = event.clientX;
    press.lastTime = event.timeStamp;
    this.host.nativeElement.scrollLeft = press.startScroll - dx;
  }

  protected onPointerUp(event: PointerEvent): void {
    const press = this.press;
    if (!press || event.pointerId !== press.pointerId) return;
    this.press = null;
    if (!this.dragging()) return;

    const el = this.host.nativeElement;
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    // The press that ended a drag must not also choose whatever is under it.
    const swallow = (click: Event) => {
      click.stopPropagation();
      click.preventDefault();
    };
    el.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 0);

    const stale = event.timeStamp - press.lastTime > STALE_MOVE_MS;
    const velocity = stale ? 0 : press.velocity;
    this.dragging.set(false);
    this.glide(el.scrollLeft - velocity * PROJECTION_MS);
  }

  /** Glides to where the release was heading. With reduced motion it simply stops. */
  private glide(projected: number): void {
    const el = this.host.nativeElement;
    if (this.behavior() === 'auto') return;
    const max = el.scrollWidth - el.clientWidth;
    const from = el.scrollLeft;
    const distance = Math.min(max, Math.max(0, projected)) - from;
    if (Math.abs(distance) < 1) return;

    const duration = Math.min(GLIDE_MAX_MS, Math.max(GLIDE_MIN_MS, Math.abs(distance) * 1.2));
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      el.scrollLeft = from + distance * easeOut(t);
      this.frame = t < 1 ? requestAnimationFrame(step) : null;
    };
    this.frame = requestAnimationFrame(step);
  }

  private behavior(): ScrollBehavior {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }
}
