import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { PlanKind, Recommendation } from '../../core/models';
import { ClockStore } from '../../core/state/clock.store';
import { IslandStore } from '../../core/state/island.store';
import { LocationsStore } from '../../core/state/locations.store';
import { msg } from '../../core/i18n/i18n.model';
import { timeWindow } from '../../core/i18n/phrases';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { Scene } from '../scene/scene';
import { zoneScene } from '../scene/scene-state';
import { Icon } from '../ui/icon/icon';
import { IconName } from '../ui/icon/icons';

const KIND: Readonly<Record<PlanKind, { icon: IconName }>> = {
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

  private readonly locations = inject(LocationsStore);
  private readonly island = inject(IslandStore);
  private readonly clock = inject(ClockStore);
  private readonly router = inject(Router);

  protected readonly kind = computed(() => KIND[this.plan().kind]);

  protected readonly when = computed(() => {
    const window = this.plan().window;
    return window ? timeWindow(window.from, window.to, this.clock.now()) : msg('common.rightNow');
  });

  protected readonly scene = computed(() => {
    if (this.variant() !== 'lead') return null;
    const zone = this.island.zone(this.plan().locationId);
    return zone ? zoneScene(zone, this.clock.now()) : null;
  });

  protected open(): void {
    this.locations.select(this.plan().locationId);
    void this.router.navigateByUrl('/');
  }
}
