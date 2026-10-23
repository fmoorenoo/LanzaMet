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
const SETTLE_MIN_MS = 240;
const SETTLE_MAX_MS = 480;

/** Emil Kowalski's strong ease-out, close to `--ease-out` in the tokens. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 5);

/**
 * Makes a horizontal scroller comfortable with a mouse, without taking
 * anything away from touch:
 *  · the edges fade while there is more to see in that direction;
 *  · it can be dragged with the mouse (a short press is still a click). On
 *    release it carries on with the hand's speed and comes to rest on the
 *    nearest snap point, so snapping never jumps when it switches back on;
 *  · `scrollPage()` drives previous/next buttons (see ScrollControls).
 * Horizontal wheels, trackpads and Shift + wheel scroll it natively. A plain
 * vertical wheel is left to the page on purpose: hijacking it would trap the
 * page's scroll whenever the pointer crosses the strip.
 */
@Directive({
  selector: '[qthHorizontalScroll]',
  exportAs: 'horizontalScroll',
  host: {
    class: 'h-scroll',
    '[class.can-scroll-back]': 'canScrollBack()',
    '[class.can-scroll-forward]': 'canScrollForward()',
    '[class.is-dragging]': 'dragging()',
    '[class.is-settling]': 'settling()',
    '(scroll)': 'measure()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
    '(wheel)': 'stopSettling()',
    '(dragstart)': '$event.preventDefault()',
  },
})
export class HorizontalScroll {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly canScrollBack = signal(false);
  readonly canScrollForward = signal(false);
  readonly overflowing = computed(() => this.canScrollBack() || this.canScrollForward());
  protected readonly dragging = signal(false);
  /** The glide after a drag; snapping waits for it as it does for the drag. */
  protected readonly settling = signal(false);

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
    element.id ||= `qth-scroller-${nextId++}`;
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
    destroyRef.onDestroy(() => this.stopSettling());
  }

  measure(): void {
    const el = this.host.nativeElement;
    const max = el.scrollWidth - el.clientWidth;
    this.canScrollBack.set(el.scrollLeft > 1);
    this.canScrollForward.set(el.scrollLeft < max - 1);
  }

  /** Moves by most of a screenful, leaving a little of the previous view as context. */
  scrollPage(direction: -1 | 1): void {
    this.stopSettling();
    const el = this.host.nativeElement;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: this.behavior() });
  }

  /** Interrupts the glide after a drag, leaving the strip where it is. */
  stopSettling(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.settling.set(false);
  }

  protected onPointerDown(event: PointerEvent): void {
    // Any new touch, pen or click catches a strip that is still gliding.
    this.stopSettling();
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
    this.settle(el.scrollLeft - velocity * PROJECTION_MS);
  }

  /**
   * Glides to where the release was heading, rounded to the nearest snap
   * point. With reduced motion it simply stops and the browser snaps.
   */
  private settle(projected: number): void {
    const el = this.host.nativeElement;
    if (this.behavior() === 'auto') return;
    const max = el.scrollWidth - el.clientWidth;
    const target = Math.round(Math.min(max, Math.max(0, this.nearestSnap(projected))));
    const from = el.scrollLeft;
    const distance = target - from;
    if (Math.abs(distance) < 1) return;

    const duration = Math.min(SETTLE_MAX_MS, Math.max(SETTLE_MIN_MS, Math.abs(distance) * 1.2));
    const start = performance.now();
    this.settling.set(true);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      el.scrollLeft = from + distance * easeOut(t);
      if (t < 1) {
        this.frame = requestAnimationFrame(step);
      } else {
        this.frame = null;
        this.settling.set(false);
      }
    };
    this.frame = requestAnimationFrame(step);
  }

  /** Scroll offsets the content snaps to (children and grandchildren that declare it). */
  private nearestSnap(position: number): number {
    const el = this.host.nativeElement;
    const box = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const padding = parseFloat(style.scrollPaddingInlineStart) || 0;
    const candidates = Array.from(el.children).flatMap((child) => [
      child,
      ...Array.from(child.children),
    ]);
    let best = position;
    let bestDistance = Infinity;
    for (const candidate of candidates) {
      // One value applies to both axes; with two, the second is the inline one.
      const inline = getComputedStyle(candidate).scrollSnapAlign.split(' ').pop();
      if (!inline || inline === 'none') continue;
      const offset = candidate.getBoundingClientRect().left - box.left + el.scrollLeft - padding;
      const distance = Math.abs(offset - position);
      if (distance < bestDistance) {
        best = offset;
        bestDistance = distance;
      }
    }
    return best;
  }

  private behavior(): ScrollBehavior {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }
}
