import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';

let nextId = 0;

/** px/ms — a flick this fast dismisses regardless of distance (Emil Kowalski). */
const DISMISS_VELOCITY = 0.11;
const DISMISS_FRACTION = 0.3;

/**
 * Bottom sheet on phones, centred panel on larger screens. Built on <dialog>
 * so focus trapping, Escape and the accessibility tree come from the platform.
 * On touch it can be dragged down to dismiss; a quick flick is enough.
 */
@Component({
  selector: 'qth-sheet',
  imports: [Icon],
  templateUrl: './sheet.html',
  styleUrl: './sheet.scss',
})
export class Sheet {
  readonly heading = input.required<string>();
  readonly open = model(false);

  protected readonly titleId = `qth-sheet-title-${nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  private drag: { pointerId: number; startY: number; startTime: number; offset: number } | null =
    null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const shouldOpen = this.open();
      untracked(() => {
        const dialog = this.dialog().nativeElement;
        if (shouldOpen && !dialog.open) {
          this.resetPanel();
          dialog.classList.remove('is-closing');
          dialog.showModal();
        } else if (!shouldOpen && dialog.open) {
          this.animateClose();
        }
      });
    });
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      if (this.closeTimer) clearTimeout(this.closeTimer);
    });

    // Tapping the dimmed backdrop closes the sheet. A pointer-only convenience:
    // keyboard users have Escape and the close button.
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      const onClick = (event: MouseEvent) => {
        if (event.target === dialog) this.close();
      };
      dialog.addEventListener('click', onClick);
      destroyRef.onDestroy(() => dialog.removeEventListener('click', onClick));
    });
  }

  close(): void {
    this.open.set(false);
  }

  /** Escape is a keyboard action: it closes at once, without choreography. */
  protected onCancel(): void {
    this.open.set(false);
  }

  protected onNativeClose(): void {
    if (this.open()) this.open.set(false);
  }

  protected onPointerDown(event: PointerEvent): void {
    // Mouse users have the close button; buttons inside the zone keep their clicks.
    if (event.pointerType === 'mouse' || this.drag) return;
    if ((event.target as Element).closest('button')) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.drag = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTime: performance.now(),
      offset: 0,
    };
    this.panel().nativeElement.classList.add('is-dragging');
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const delta = event.clientY - this.drag.startY;
    // Dragging up past the resting point meets increasing resistance.
    const offset = delta >= 0 ? delta : -Math.sqrt(-delta) * 2;
    this.drag.offset = offset;
    this.panel().nativeElement.style.transform = `translate3d(0, ${offset}px, 0)`;
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const { offset, startTime } = this.drag;
    this.drag = null;
    const panel = this.panel().nativeElement;
    panel.classList.remove('is-dragging');
    const velocity = offset / Math.max(1, performance.now() - startTime);
    const dismiss =
      offset > panel.offsetHeight * DISMISS_FRACTION || (offset > 8 && velocity > DISMISS_VELOCITY);
    panel.style.transform = '';
    if (dismiss) this.close();
  }

  private animateClose(): void {
    const dialog = this.dialog().nativeElement;
    const panel = this.panel().nativeElement;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    dialog.classList.add('is-closing');
    const finish = () => {
      if (this.closeTimer) clearTimeout(this.closeTimer);
      this.closeTimer = null;
      panel.removeEventListener('transitionend', onEnd);
      dialog.close();
      dialog.classList.remove('is-closing');
      this.resetPanel();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target === panel) finish();
    };
    if (reduce) {
      finish();
      return;
    }
    panel.addEventListener('transitionend', onEnd);
    this.closeTimer = setTimeout(finish, 400);
  }

  private resetPanel(): void {
    this.panel().nativeElement.style.transform = '';
  }
}
