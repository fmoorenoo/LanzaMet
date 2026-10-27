import { Component, computed, inject, input } from '@angular/core';
import { ZoneNavigation } from '../../core/state/zone-navigation';
import { IsoDate, PlanKind, Recommendation } from '../../core/models';
import { ClockStore } from '../../core/state/clock.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { msg } from '../../core/i18n/i18n.model';
import { timeWindow } from '../../core/i18n/phrases';
import { islandDateKey } from '../../core/utils/time';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { Scene } from '../scene/scene';
import { zoneScene } from '../scene/scene-state';
import { Icon } from '../ui/icon/icon';
import { IconName } from '../ui/icon/icons';

export const PLAN_KIND: Readonly<Record<PlanKind, { icon: IconName }>> = {
  playa: { icon: 'beach' },
  resguardo: { icon: 'shelter' },
  'mar-calmo': { icon: 'swim' },
  paseo: { icon: 'walk' },
  atardecer: { icon: 'sunset' },
  olas: { icon: 'surf' },
};

/** One suggestion. Choosing it opens that place's day. */
@Component({
  selector: 'lm-plan-item',
  imports: [Icon, Scene, TranslatePipe],
  templateUrl: './plan-item.html',
  styleUrl: './plan-item.scss',
  host: {
    class: 'plan-card',
    '[class.is-lead]': "variant() === 'lead'",
    '[attr.data-plan-kind]': 'plan().kind',
    '[attr.data-location-id]': 'plan().locationId',
  },
})
export class PlanItem {
  readonly plan = input.required<Recommendation>();
  readonly variant = input<'lead' | 'row'>('row');
  /** The day the plan is for, when it is not today: a plan without hours then names it. */
  readonly day = input<IsoDate | null>(null);

  private readonly locations = inject(LocationsStore);
  private readonly island = inject(IslandStore);
  private readonly clock = inject(ClockStore);
  private readonly zones = inject(ZoneNavigation);

  protected readonly kind = computed(() => PLAN_KIND[this.plan().kind]);

  protected readonly when = computed(() => {
    const window = this.plan().window;
    const now = this.clock.now();
    if (window) return timeWindow(window.from, window.to, now);
    const day = this.day();
    const today = islandDateKey(now);
    return day && day !== today
      ? msg('common.value', { value: { day, today } })
      : msg('common.rightNow');
  });

  protected readonly scene = computed(() => {
    if (this.variant() !== 'lead') return null;
    const zone = this.island.zone(this.plan().locationId);
    return zone ? zoneScene(zone, this.clock.now()) : null;
  });

  protected open(): void {
    this.zones.open(this.plan().locationId);
  }
}
