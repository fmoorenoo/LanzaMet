import { Component, computed, inject } from '@angular/core';
import { DATA_MODE } from '../../core/data/http/data-config';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { IslandStore } from '../../core/state/island.store';
import { PlanItem } from '../../shared/plans/plan-item';
import { DataCredit } from '../../shared/ui/data-credit/data-credit';
import { StatusMessage } from '../../shared/ui/status-message/status-message';

/** Concrete suggestions for today, the best one first and shown as a place. */
@Component({
  selector: 'qth-plans-page',
  host: { id: 'plans-page', class: 'page plans-page' },
  imports: [PlanItem, StatusMessage, DataCredit, TranslatePipe],
  template: `
    <header id="plans-header" class="page-head page-header">
      <h1 class="t-display">{{ 'route.plans' | t }}</h1>
      <p class="t-lead t-muted lead">
        {{ (isDemo ? 'plans.leadDemo' : 'plans.lead') | t }}
      </p>
    </header>

    <div class="content">
      @switch (island.zones().status) {
        @case ('ready') {
          @if (lead(); as first) {
            <qth-plan-item id="lead-plan" class="enter-settle" [plan]="first" variant="lead" />
            @if (rest().length > 0) {
              <section id="more-plans" class="more" aria-labelledby="more-title">
                <h2 id="more-title" class="t-title">{{ 'plans.more' | t }}</h2>
                <ul class="list plan-list">
                  @for (plan of rest(); track plan.id; let i = $index) {
                    <li class="enter-rise" [style.--i]="i + 1">
                      <qth-plan-item [plan]="plan" />
                    </li>
                  }
                </ul>
              </section>
            }
          } @else {
            <qth-status-message [title]="'today.noPlan' | t" [text]="'today.noPlan.text' | t" />
          }
        }
        @case ('error') {
          <qth-status-message
            tone="error"
            [title]="'today.compareFailed' | t"
            [text]="island.zones().error | t"
            [actionLabel]="'common.retry' | t"
            (action)="island.retry()"
          />
        }
        @default {
          <div class="skeleton lead-skeleton" [attr.aria-label]="'plans.loading' | t"></div>
        }
      }

      <footer id="plans-footer" class="page-foot">
        <qth-data-credit kind="island" [updatedAt]="island.updatedAt()" />
      </footer>
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding-bottom: var(--s-10);
    }
    .page-head {
      display: grid;
      gap: var(--s-3);
      padding: calc(var(--safe-top) + var(--s-8)) var(--gutter) var(--s-6);
    }
    .lead {
      max-width: 36ch;
    }
    .content {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--s-10);
      padding: 0 var(--gutter);
    }
    .more {
      display: grid;
      gap: var(--s-2);
    }
    .list li + li {
      border-top: 1px solid var(--c-line);
    }
    .page-foot {
      grid-column: 1 / -1;
    }
    .lead-skeleton {
      height: 16rem;
      border-radius: var(--r-lg);
    }
    @media (min-width: 48rem) {
      .page-head,
      .content {
        max-width: 44rem;
        margin-inline: auto;
      }
      .page-head {
        padding-top: var(--s-12);
      }
    }
    @media (min-width: 72rem) {
      .page-head,
      .content {
        max-width: 68rem;
      }
      .content {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: start;
      }
    }
  `,
})
export class PlansPage {
  protected readonly island = inject(IslandStore);
  protected readonly isDemo = inject(DATA_MODE) === 'demo';

  protected readonly lead = computed(() => this.island.recommendations()[0] ?? null);
  protected readonly rest = computed(() => this.island.recommendations().slice(1));
}
