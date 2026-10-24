import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import {
  CLOUD_PATH,
  CLOUDS,
  horizonPaths,
  RAIN_DROPS,
  RainDrop,
  rainDropCount,
  SEA_SPEED,
  shorePath,
  STARS,
  WAVE_DURATIONS,
  wavePaths,
} from './geometry';
import { afloatFor, cloudOpacity, glintFor, visibleClouds } from './layers';
import { SceneState } from './scene-state';
import { AFLOAT_PATHS, sceneryArt } from './scenery';

/**
 * The day, drawn. A purely visual layer (hidden from assistive tech): the
 * same facts are always written in words next to it.
 *
 * Motion budget: clouds and swell drift with WAAPI transform animations
 * (composited, off the main thread), their speed retargeted with
 * `updatePlaybackRate` so a change of wind never makes them jump. Rain is a
 * field of single streaks on CSS transform animations, more of them the
 * harder it rains. Ambient loops pause off-screen, in background tabs and
 * under reduced motion.
 */
/** The rain layer's fade (`--d-atmos`): streaks stay until it has faded out. */
const RAIN_FADE_MS = 900;

@Component({
  selector: 'lm-scene',
  templateUrl: './scene.html',
  styleUrl: './scene.scss',
  host: {
    class: 'weather-scene',
    'aria-hidden': 'true',
    '[class.is-mini]': "variant() === 'mini'",
    // What the scene is drawing, readable from the browser's dev tools.
    '[attr.data-variant]': 'variant()',
    '[attr.data-horizon]': 'state().horizon',
    '[attr.data-scenery]': 'state().scenery',
    '[attr.data-sea-level]': 'state().seaLevel',
    '[attr.data-ink]': 'state().ink',
  },
})
export class Scene {
  readonly state = input.required<SceneState>();
  readonly variant = input<'full' | 'mini'>('full');

  protected readonly clouds = CLOUDS;
  protected readonly cloudPath = CLOUD_PATH;
  protected readonly stars = STARS;

  protected readonly horizon = computed(() => horizonPaths(this.state().horizon));
  protected readonly shore = computed(() => shorePath(this.state().shoreKind));
  protected readonly scenery = computed(() => sceneryArt(this.state().scenery));
  protected readonly shapes = AFLOAT_PATHS;

  protected readonly afloat = computed(() => afloatFor(this.scenery(), this.state()));

  protected readonly waves = computed(() => {
    const level = this.state().seaLevel;
    return [wavePaths(level, 150, 0.45), wavePaths(level, 240, 0.75), wavePaths(level, 300, 1)];
  });

  private readonly visibleClouds = computed(() =>
    visibleClouds(this.state(), this.variant() === 'mini'),
  );

  protected readonly sunTransform = computed(
    () => `translate3d(${this.state().sun.x}%, ${this.state().sun.y}%, 0)`,
  );
  protected readonly moonTransform = computed(
    () => `translate3d(${this.state().moon.x}%, ${this.state().moon.y}%, 0)`,
  );

  /** The sea reflects whichever light is up. */
  protected readonly glint = computed(() => {
    const glint = glintFor(this.state());
    return {
      transform: `translate3d(${glint.x}%, 0, 0)`,
      opacity: glint.opacity,
      color: glint.color,
    };
  });

  protected readonly tideTransform = computed(
    () => `translate3d(0, ${((0.5 - this.state().tide) * 30).toFixed(2)}%, 0)`,
  );

  private readonly cloudTracks = viewChildren<ElementRef<HTMLElement>>('cloudTrack');
  private readonly waveTracks = viewChildren<ElementRef<HTMLElement>>('waveTrack');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Streaks being drawn; they outlive the rain by its fade, so it never cuts out. */
  protected readonly rainDrops = signal<readonly RainDrop[]>([]);
  private rainFade: ReturnType<typeof setTimeout> | null = null;

  private cloudAnimations: Animation[] = [];
  private waveAnimations: Animation[] = [];
  private onScreen = true;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (this.variant() === 'mini') return;
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      const sync = () => (motion.matches ? this.stopAmbient() : this.startAmbient());
      sync();
      motion.addEventListener('change', sync);

      const observer = new IntersectionObserver(([entry]) => {
        this.onScreen = entry.isIntersecting;
        this.updatePlayState();
      });
      observer.observe(this.host.nativeElement);

      const onVisibility = () => this.updatePlayState();
      document.addEventListener('visibilitychange', onVisibility);

      destroyRef.onDestroy(() => {
        motion.removeEventListener('change', sync);
        observer.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        this.stopAmbient();
      });
    });

    effect(() => {
      const count = rainDropCount(this.state().rainIntensity, this.variant() === 'mini');
      untracked(() => this.showRain(count));
    });
    destroyRef.onDestroy(() => {
      if (this.rainFade) clearTimeout(this.rainFade);
    });

    // Wind and sea changes retarget speed smoothly instead of restarting.
    effect(() => {
      const rate = 1 + this.state().wind * 3.2;
      untracked(() => this.cloudAnimations.forEach((a) => a.updatePlaybackRate(rate)));
    });
    effect(() => {
      const rate = SEA_SPEED[this.state().seaLevel];
      untracked(() => this.waveAnimations.forEach((a) => a.updatePlaybackRate(rate)));
    });
  }

  protected cloudOpacity(index: number): number {
    return cloudOpacity(this.state(), index, this.visibleClouds());
  }

  protected cssPath(d: string): string {
    return `path("${d}")`;
  }

  private showRain(count: number): void {
    if (this.rainFade) clearTimeout(this.rainFade);
    this.rainFade = null;
    if (count > 0) {
      this.rainDrops.set(RAIN_DROPS.slice(0, count));
      // New streaks start running at once; hold them if the scene is off-screen.
      requestAnimationFrame(() => this.updatePlayState());
    } else if (this.rainDrops().length > 0) {
      this.rainFade = setTimeout(() => this.rainDrops.set([]), RAIN_FADE_MS);
    }
  }

  private startAmbient(): void {
    if (this.cloudAnimations.length > 0) return;
    const state = untracked(this.state);

    this.cloudAnimations = this.cloudTracks().map((track, i) => {
      const cloud = CLOUDS[i];
      const duration = cloud.seconds * 1000;
      const animation = track.nativeElement.animate(
        [{ transform: 'translate3d(-40%, 0, 0)' }, { transform: 'translate3d(105%, 0, 0)' }],
        { duration, iterations: Infinity, delay: -cloud.phase * duration },
      );
      animation.updatePlaybackRate(1 + state.wind * 3.2);
      return animation;
    });

    this.waveAnimations = this.waveTracks().map((track, i) => {
      const duration = WAVE_DURATIONS[i] * 1000;
      const animation = track.nativeElement.animate(
        [{ transform: 'translate3d(0, 0, 0)' }, { transform: 'translate3d(-50%, 0, 0)' }],
        { duration, iterations: Infinity, delay: -duration * (0.2 + i * 0.3) },
      );
      animation.updatePlaybackRate(SEA_SPEED[state.seaLevel]);
      return animation;
    });

    this.updatePlayState();
  }

  private stopAmbient(): void {
    [...this.cloudAnimations, ...this.waveAnimations].forEach((a) => a.cancel());
    this.cloudAnimations = [];
    this.waveAnimations = [];
  }

  /** Off-screen or in a background tab, every loop in the scene holds still. */
  private updatePlayState(): void {
    const play = this.onScreen && document.visibilityState === 'visible';
    const loops = this.host.nativeElement
      .getAnimations({ subtree: true })
      .filter((a) => a.effect?.getComputedTiming().iterations === Infinity);
    loops.forEach((a) => (play ? a.play() : a.pause()));
  }
}
