import { DestroyRef, Signal, afterNextRender, inject, signal } from '@angular/core';

/**
 * `true` once the window has scrolled past `threshold` px. SSR-safe: the
 * listener attaches after the first browser render (always `false` on the server).
 */
export function scrolledPast(threshold: number): Signal<boolean> {
  const scrolled = signal(false);
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      scrolled.set(window.scrollY > threshold);
    };
    const onScroll = () => (frame ||= requestAnimationFrame(update));
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    });
  });
  return scrolled.asReadonly();
}
