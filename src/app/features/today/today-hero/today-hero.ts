import { Component, computed, inject, input, output } from '@angular/core';
import { DATA_MODE } from '../../../core/data/http/data-config';
import { Verdict } from '../../../core/insights/verdict.insight';
import { LocationId } from '../../../core/models';
import { LocationsStore } from '../../../core/state/locations.store';
import { UiStore } from '../../../layout/ui.store';
import { Scene } from '../../../shared/scene/scene';
import { SceneState } from '../../../shared/scene/scene-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { StatusMessage } from '../../../shared/ui/status-message/status-message';

export interface HeroView {
  readonly scene: SceneState;
  readonly temperature: number;
  readonly verdict: Verdict;
  readonly momentLabel: string;
}

/**
 * The answer, before anything else: the day drawn as a scene, then the
 * temperature, the verdict and one sentence. Place switching lives here too,
 * so changing place happens where its effect is seen.
 */
@Component({
  selector: 'qth-today-hero',
  imports: [Scene, Icon, StatusMessage],
  templateUrl: './today-hero.html',
  styleUrl: './today-hero.scss',
  host: {
    role: 'region',
    'aria-labelledby': 'verdict',
    '[class.is-ink-dark]': "view()?.scene?.ink === 'dark'",
  },
})
export class TodayHero {
  readonly view = input<HeroView | null>(null);
  /** A newer request is in flight: the words soften until it lands. */
  readonly pending = input(false);
  /** Set when there is nothing to show because loading failed. */
  readonly error = input<string | null>(null);
  readonly isPreview = input(false);

  readonly backToNow = output<void>();
  readonly retry = output<void>();

  protected readonly ui = inject(UiStore);
  protected readonly isDemo = inject(DATA_MODE) === 'demo';
  private readonly locations = inject(LocationsStore);

  protected readonly current = this.locations.selected;

  /** Favourites to hop between without opening the picker. */
  protected readonly others = computed(() =>
    this.locations.favorites().filter((l) => l.id !== this.current()?.id),
  );

  protected readonly isFavorite = computed(() => {
    const id = this.current()?.id;
    return id ? this.locations.isFavorite(id) : false;
  });

  protected toggleFavorite(): void {
    const id = this.current()?.id;
    if (id) this.locations.toggleFavorite(id);
  }

  protected selectPlace(id: LocationId): void {
    this.locations.select(id);
  }
}
