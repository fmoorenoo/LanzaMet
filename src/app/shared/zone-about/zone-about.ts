import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { webcamFor } from '../../core/data/webcams';
import { ZONE_GUIDE } from '../../core/data/zone-guide';
import { MessageKey, msg } from '../../core/i18n/i18n.model';
import { I18n } from '../../core/i18n/i18n.store';
import { zonePath, ZoneView } from '../../core/i18n/localized-paths';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { Location } from '../../core/models';
import { zoneById } from '../../core/state/zone-navigation';
import { distanceKm } from '../../core/utils/geo';
import { Icon } from '../ui/icon/icon';
import { WebcamLink } from '../ui/webcam-link/webcam-link';

/**
 * What makes a place itself, at the end of its pages (/tiempo/:zona,
 * /mar/:zona): one sentence, a few facts the app already knows (municipality,
 * the coast it faces, how far out its sea is read, its station, its camera),
 * and the way to its other page and to the places beside it.
 */
@Component({
  selector: 'lm-zone-about',
  imports: [RouterLink, Icon, WebcamLink, TranslatePipe],
  template: `
    @let place = location();
    <section
      id="zone-about"
      class="zone-about"
      [attr.data-location-id]="place.id"
      aria-labelledby="zone-about-title"
    >
      <h2 id="zone-about-title" class="t-title">
        {{ 'zone.about.title' | t: { place: place.name } }}
      </h2>
      <p class="lead">{{ about() | t }}</p>

      <dl class="facts">
        <div class="fact" data-fact="municipality">
          <dt><lm-icon name="pin" />{{ 'zone.fact.municipality' | t }}</dt>
          <dd>{{ place.municipality }}</dd>
        </div>
        <div class="fact" data-fact="coast">
          <dt><lm-icon name="plans" />{{ 'zone.fact.coast' | t }}</dt>
          <dd>{{ coast() | t }}</dd>
        </div>
        @if (seaKm(); as km) {
          <div class="fact" data-fact="sea">
            <dt><lm-icon name="waves" />{{ 'zone.fact.sea' | t }}</dt>
            <dd>{{ 'zone.fact.sea.value' | t: { km } }}</dd>
          </div>
        }
        <div class="fact" data-fact="station">
          <dt><lm-icon name="thermometer" />{{ 'zone.fact.station' | t }}</dt>
          <dd>{{ station() | t }}</dd>
        </div>
        @if (hasWebcam()) {
          <div class="fact" data-fact="webcam">
            <dt><lm-icon name="camera" />{{ 'fact.webcam' | t }}</dt>
            <dd><lm-webcam-link [locationId]="place.id" variant="inline" /></dd>
          </div>
        }
      </dl>

      @if (shared(); as other) {
        <p class="note">
          <lm-icon name="info" />
          <span>{{ 'zone.shared' | t: { place: place.name, other: other.name } }}</span>
        </p>
      }

      <nav class="ways" [attr.aria-label]="'zone.nearby' | t">
        <a class="chip way is-other" [routerLink]="otherPage()">
          <lm-icon [name]="view() === 'weather' ? 'waves' : 'today'" />
          {{ (view() === 'weather' ? 'zone.toSea' : 'zone.toWeather') | t: { place: place.name } }}
        </a>
        @for (near of nearby(); track near.id) {
          <a class="chip way" [routerLink]="near.path">
            <lm-icon name="pin" />
            {{ near.name }}
          </a>
        }
      </nav>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .zone-about {
      display: grid;
      gap: var(--s-3);
    }

    .lead {
      max-width: 52ch;
      color: var(--c-ink-2);
      text-wrap: pretty;
    }

    // As "Hoy, en detalle": a label with its icon, and the value beside it.
    .facts {
      display: grid;
    }

    .fact {
      display: grid;
      grid-template-columns: 7rem 1fr;
      gap: var(--s-3);
      padding: var(--s-3) 0;

      & + & {
        border-top: 1px solid var(--c-line);
      }

      dt {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        align-self: start;
        font-size: var(--fs-small);
        font-weight: 600;
        color: var(--c-ink-2);

        lm-icon {
          width: var(--icon-sm);
          height: var(--icon-sm);
        }
      }

      dd {
        margin: 0;
      }
    }

    .note {
      display: flex;
      align-items: flex-start;
      gap: var(--s-2);
      padding: var(--s-3);
      border-radius: var(--r-md);
      background-color: var(--c-surface-sunken);
      color: var(--c-ink-2);
      font-size: var(--fs-small);
      text-wrap: pretty;

      lm-icon {
        flex: none;
        width: var(--icon-sm);
        height: var(--icon-sm);
        margin-top: 0.125rem;
      }
    }

    .ways {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s-2);
      margin-top: var(--s-1);
    }

    .way lm-icon {
      width: var(--icon-xs);
      height: var(--icon-xs);
      color: var(--c-ink-3);
    }

    .way.is-other {
      border-color: transparent;
      background-color: var(--c-accent-soft);
      color: var(--c-accent);

      lm-icon {
        color: inherit;
      }
    }
  `,
})
export class ZoneAbout {
  readonly location = input.required<Location>();
  /** Which of the place's pages this is: the block leads to the other one. */
  readonly view = input.required<ZoneView>();

  private readonly i18n = inject(I18n);
  private readonly guide = computed(() => ZONE_GUIDE[this.location().id] ?? null);

  protected readonly about = computed(() => `zone.about.${this.location().id}` as MessageKey);
  protected readonly coast = computed(() =>
    msg('zone.fact.coast.value', { dir: msg(`dir.${this.location().facing}` as MessageKey) }),
  );
  /** How far out the sea is read (README: "Punto de mar abierto", 4–18 km). */
  protected readonly seaKm = computed(() => {
    const { position, coverage } = this.location();
    return coverage.sea ? Math.round(distanceKm(position, coverage.sea)) : null;
  });
  protected readonly station = computed(() => {
    const station = this.guide()?.station;
    return station ? msg('zone.fact.station.value', { station }) : msg('zone.fact.station.none');
  });
  /** Hoy already shows the camera in its details; only the sea page needs it here. */
  protected readonly hasWebcam = computed(
    () => this.view() === 'sea' && webcamFor(this.location().id) !== null,
  );
  protected readonly shared = computed(() =>
    zoneById(this.guide()?.sharesWeatherWith ?? undefined),
  );

  protected readonly otherPage = computed(() =>
    zonePath(this.view() === 'weather' ? 'sea' : 'weather', this.location().id, this.i18n.lang()),
  );
  protected readonly nearby = computed(() =>
    (this.guide()?.nearby ?? [])
      .map((id) => zoneById(id))
      .filter((zone) => zone !== null)
      .map((zone) => ({
        id: zone.id,
        name: zone.name,
        path: zonePath(this.view(), zone.id, this.i18n.lang()),
      })),
  );
}
