import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { msg } from '../../../core/i18n/i18n.model';
import { timeWindow } from '../../../core/i18n/phrases';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { readSea } from '../../../core/insights/sea.insight';
import { Recommendation } from '../../../core/models';
import { ClockStore } from '../../../core/state/clock.store';
import { IslandStore } from '../../../core/state/island.store';
import { LocationsStore } from '../../../core/state/locations.store';
import { PLAN_KIND } from '../../../shared/plans/plan-item';
import { Scene } from '../../../shared/scene/scene';
import { zoneScene } from '../../../shared/scene/scene-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { WebcamLink } from '../../../shared/ui/webcam-link/webcam-link';
import { WindGauge } from '../../../shared/ui/wind-gauge/wind-gauge';
import { ISLAND_PATHS, MAP_SIZE, project } from '../../zones/island-map/island-geometry';

/**
 * A suggestion shown as the place itself: its own landscape in today's
 * light, where it lies on the island, why it suits today, and the facts
 * worth comparing between places (temperature, wind, sea). Choosing it
 * opens that place's day.
 *
 * `lead` is the day's first idea, wide; `card` the others.
 */
@Component({
  selector: 'lm-plan-card',
  imports: [Icon, Scene, WindGauge, WebcamLink, TranslatePipe],
  templateUrl: './plan-card.html',
  styleUrl: './plan-card.scss',
  host: {
    class: 'plan-card',
    '[class.is-lead]': "variant() === 'lead'",
    '[attr.data-plan-kind]': 'plan().kind',
    '[attr.data-location-id]': 'plan().locationId',
  },
})
export class PlanCard {
  readonly plan = input.required<Recommendation>();
  readonly variant = input<'lead' | 'card'>('card');

  private readonly locations = inject(LocationsStore);
  private readonly island = inject(IslandStore);
  private readonly clock = inject(ClockStore);
  private readonly router = inject(Router);

  protected readonly icon = computed(() => PLAN_KIND[this.plan().kind].icon);
  protected readonly zone = computed(() => this.island.zone(this.plan().locationId));

  protected readonly when = computed(() => {
    const window = this.plan().window;
    return window ? timeWindow(window.from, window.to, this.clock.now()) : msg('common.rightNow');
  });

  protected readonly scene = computed(() => {
    const zone = this.zone();
    return zone ? zoneScene(zone, this.clock.now()) : null;
  });

  /** The facts to compare: temperature, wind and, where the model reaches, the sea. */
  protected readonly facts = computed(() => {
    const zone = this.zone();
    if (!zone) return null;
    const now = zone.weather.current;
    return {
      temperature: Math.round(now.temperatureC),
      wind: now.wind,
      sea: zone.sea ? readSea(zone.sea.current).label : null,
      place: zone.location.name,
    };
  });

  /** The island in miniature, with this place marked. */
  protected readonly map = MAP_SIZE;
  protected readonly outline = ISLAND_PATHS;
  protected readonly pin = computed(() => {
    const zone = this.zone();
    return zone ? project(zone.location.position) : null;
  });

  protected open(): void {
    this.locations.select(this.plan().locationId);
    void this.router.navigateByUrl('/');
  }
}
