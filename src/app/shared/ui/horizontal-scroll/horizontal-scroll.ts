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
/** px/ms — a release faster than this keeps gliding for a moment. */
const FLING_VELOCITY = 0.35;
const FLING_MS = 220;

/**
 * Makes a horizontal scroller comfortable with a mouse, without taking
 * anything away from touch:
 *  · the edges fade while there is more to see in that direction;
 *  · it can be dragged with the mouse (a short press is still a click);
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
    '(scroll)': 'measure()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
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
  }

  measure(): void {
    const el = this.host.nativeElement;
    const max = el.scrollWidth - el.clientWidth;
    this.canScrollBack.set(el.scrollLeft > 1);
    this.canScrollForward.set(el.scrollLeft < max - 1);
  }

  /** Moves by most of a screenful, leaving a little of the previous view as context. */
  scrollPage(direction: -1 | 1): void {
    const el = this.host.nativeElement;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: this.behavior() });
  }

  protected onPointerDown(event: PointerEvent): void {
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
    }
    const dt = Math.max(1, event.timeStamp - press.lastTime);
    press.velocity = (event.clientX - press.lastX) / dt;
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

    this.dragging.set(false);
    // A quick release keeps a little of its speed, like a flick on a phone.
    if (Math.abs(press.velocity) > FLING_VELOCITY && this.behavior() === 'smooth') {
      el.scrollBy({ left: -press.velocity * FLING_MS, behavior: 'smooth' });
    }
  }

  private behavior(): ScrollBehavior {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }
}
