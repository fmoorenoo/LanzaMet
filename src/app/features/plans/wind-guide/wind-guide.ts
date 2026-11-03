import { Component, computed, inject } from '@angular/core';
import { MessageKey } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { WindSituation, windSituations } from '../../../core/insights/shelter.insight';
import { IslandStore } from '../../../core/state/island.store';

interface GuideLine {
  readonly label: MessageKey;
  readonly text: MessageKey;
}

interface GuideItem {
  readonly id: WindSituation;
  readonly title: MessageKey;
  readonly when: MessageKey;
  readonly lines: readonly GuideLine[];
}

/** What usually happens on each kind of day: written by hand, the same every day. */
const GUIDE: readonly GuideItem[] = [
  {
    id: 'alisio',
    title: 'plans.guide.alisio.title',
    when: 'plans.guide.alisio.when',
    lines: [
      { label: 'plans.guide.label.better', text: 'plans.guide.alisio.better' },
      { label: 'plans.guide.label.windier', text: 'plans.guide.alisio.windier' },
    ],
  },
  {
    id: 'mar-de-fondo',
    title: 'plans.guide.swell.title',
    when: 'plans.guide.swell.when',
    lines: [
      { label: 'plans.guide.label.calmerSea', text: 'plans.guide.swell.calmer' },
      { label: 'plans.guide.label.bigWaves', text: 'plans.guide.swell.waves' },
    ],
  },
  {
    id: 'sur',
    title: 'plans.guide.south.title',
    when: 'plans.guide.south.when',
    lines: [
      { label: 'plans.guide.label.better', text: 'plans.guide.south.better' },
      { label: 'plans.guide.label.windier', text: 'plans.guide.south.windier' },
    ],
  },
  {
    id: 'calma',
    title: 'plans.guide.calm.title',
    when: 'plans.guide.calm.when',
    lines: [{ label: 'plans.guide.label.goodFor', text: 'plans.guide.calm.goodFor' }],
  },
];

/**
 * "Where to go when it's windy": the answer in one paragraph, then the four
 * kinds of day and which coast each one favours. Fixed text, so it is in the
 * page from the first byte; once the forecast arrives, today's kind is marked.
 */
@Component({
  selector: 'lm-wind-guide',
  host: { class: 'wind-guide' },
  imports: [TranslatePipe],
  template: `
    <section id="plans-wind-guide" class="block" aria-labelledby="wind-guide-title">
      <h2 id="wind-guide-title" class="t-title">{{ 'plans.guide.title' | t }}</h2>
      <p class="answer">{{ 'plans.guide.answer' | t }}</p>

      <ul class="days" role="list">
        @for (item of guide; track item.id) {
          <li class="day" [class.is-today]="today().has(item.id)" [attr.data-situation]="item.id">
            <h3 class="day-title">
              {{ item.title | t }}
              @if (today().has(item.id)) {
                <span class="today-badge">{{ 'plans.guide.today' | t }}</span>
              }
            </h3>
            <p class="when t-small">{{ item.when | t }}</p>
            @for (line of item.lines; track line.label) {
              <p class="line t-small">
                <strong>{{ line.label | t }}:</strong> {{ line.text | t }}
              </p>
            }
          </li>
        }
      </ul>

      <p class="note t-small t-muted">{{ 'plans.guide.note' | t }}</p>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .block {
      display: grid;
      gap: var(--s-4);
    }
    .answer {
      max-width: 60ch;
      font-size: var(--fs-body);
      color: var(--c-ink);
      text-wrap: pretty;
    }
    .days {
      display: grid;
      gap: var(--s-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .day {
      display: grid;
      gap: var(--s-1);
      padding: var(--s-4);
      border: 1px solid var(--c-line);
      border-radius: var(--r-lg);
      background-color: var(--c-surface);
      transition: border-color var(--d-base) ease;
    }
    // Today's kind of day, said in words (the badge) and drawn with the accent.
    .day.is-today {
      border-color: var(--c-accent);
      box-shadow: inset 0 0 0 1px var(--c-accent);
    }
    .day-title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--s-2);
      font-size: 1.0625rem;
      font-weight: 660;
      line-height: 1.3;
      color: var(--c-ink);
    }
    .today-badge {
      padding: 0.125rem var(--s-2);
      border-radius: var(--r-pill);
      background-color: var(--c-accent);
      color: var(--c-accent-ink);
      font-size: var(--fs-micro);
      font-weight: 650;
    }
    .when {
      color: var(--c-ink-2);
    }
    .line {
      color: var(--c-ink);
      strong {
        font-weight: 640;
      }
    }
    .note {
      max-width: 60ch;
      text-wrap: pretty;
    }
    @media (min-width: 48rem) {
      .days {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .day {
        transition: none;
      }
    }
  `,
})
export class WindGuide {
  private readonly island = inject(IslandStore);

  protected readonly guide = GUIDE;

  /** Today's kinds of day; empty until the forecast arrives, and in the prerendered page. */
  protected readonly today = computed(() => windSituations(this.island.zones().data ?? []));
}
