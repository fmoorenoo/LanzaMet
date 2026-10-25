import { Component, computed, inject } from '@angular/core';
import { DATA_MODE } from '../../core/data/http/data-config';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { IslandStore } from '../../core/state/island.store';
import { DataCredit } from '../../shared/ui/data-credit/data-credit';
import { StatusMessage } from '../../shared/ui/status-message/status-message';
import { PlanCard } from './plan-card/plan-card';

/**
 * Where to go today, as a way of discovering the island: the best idea first
 * and wide, the others as postcards of their places, each with the facts to
 * compare (temperature, wind, sea). Suggestions, never guarantees.
 */
@Component({
  selector: 'lm-plans-page',
  host: { id: 'plans-page', class: 'page plans-page' },
  imports: [PlanCard, StatusMessage, DataCredit, TranslatePipe],
  template: `
    <header id="plans-header" class="page-head page-header">
      <h1 class="t-display">{{ 'route.plans' | t }}</h1>
      @if (island.zones().status === 'ready') {
        <p id="island-summary" class="summary t-lead">{{ island.summary() | t }}</p>
      }
      <p class="lead t-small t-muted">
        {{ (isDemo ? 'plans.leadDemo' : 'plans.lead') | t }}
      </p>
    </header>

    <div class="content">
      @switch (island.zones().status) {
        @case ('ready') {
          @if (lead(); as first) {
            <lm-plan-card id="lead-plan" class="enter-settle" [plan]="first" variant="lead" />
            @if (rest().length > 0) {
              <section id="more-plans" class="more" aria-labelledby="more-title">
                <h2 id="more-title" class="t-title">{{ 'plans.more' | t }}</h2>
                <ul class="grid plan-list">
                  @for (plan of rest(); track plan.id; let i = $index) {
                    <li class="enter-rise" [style.--i]="i + 1">
                      <lm-plan-card [plan]="plan" />
                    </li>
                  }
                </ul>
              </section>
            }
          } @else {
            <lm-status-message [title]="'today.noPlan' | t" [text]="'today.noPlan.text' | t" />
          }
        }
        @case ('error') {
          <lm-status-message
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
        <lm-data-credit kind="island" [updatedAt]="island.updatedAt()" />
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
      padding: calc(var(--safe-top) + var(--s-8)) var(--gutter) var(--s-8);
    }
    .summary {
      max-width: 32ch;
      font-weight: 560;
    }
    .lead {
      max-width: 52ch;
    }
    .content {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--s-10);
      padding: 0 var(--gutter);
    }
    .more {
      display: grid;
      gap: var(--s-4);
    }
    .grid {
      display: grid;
      gap: var(--s-4);
    }
    // Each card fills its cell, so the two in a row end at the same line.
    .grid > li {
      display: grid;
    }
    .lead-skeleton {
      height: 13rem;
      border-radius: var(--r-lg);
    }
    @media (min-width: 48rem) {
      .page-head,
      .content {
        max-width: 52rem;
        margin-inline: auto;
      }
      .page-head {
        padding-top: var(--s-12);
      }
    }
    @media (min-width: 72rem) {
      .page-head,
      .content {
        max-width: 72rem;
      }
      // Two even columns of row cards: every idea the same size, read in pairs.
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--s-5);
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
