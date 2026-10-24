import { effect, signal, Signal, Type, untracked } from '@angular/core';

/**
 * A component fetched the first time `when` becomes true, and kept from then
 * on. Lighter than `@defer` for one or two pieces of chrome: no defer runtime
 * in the first bundle, only a dynamic import. Must be created in an injection
 * context. Render it with NgComponentOutlet.
 */
export function lazyComponent(
  when: () => boolean,
  load: () => Promise<Type<unknown>>,
): Signal<Type<unknown> | null> {
  const component = signal<Type<unknown> | null>(null);
  let loading = false;
  effect(() => {
    if (!when() || loading) return;
    loading = true;
    untracked(() => {
      load().then(
        (type) => component.set(type),
        // Unreachable chunk (offline before the app was kept): try again next time.
        () => (loading = false),
      );
    });
  });
  return component.asReadonly();
}
