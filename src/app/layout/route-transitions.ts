import { Service } from '@angular/core';

/**
 * Tracks the router's current view transition. While a transition prepares
 * the new page the screen is frozen, so anything that animates in the live
 * DOM (the tab capsule) waits until the transition is on screen.
 */
@Service()
export class RouteTransitions {
  private current: ViewTransition | null = null;

  track(transition: ViewTransition): void {
    this.current = transition;
    const clear = () => {
      if (this.current === transition) this.current = null;
    };
    transition.finished.then(clear, clear);
  }

  /** Runs `action` once the screen is live again (immediately if nothing is pending). */
  whenVisible(action: () => void): void {
    const transition = this.current;
    if (!transition) {
      action();
      return;
    }
    transition.ready.then(action, action);
  }
}
