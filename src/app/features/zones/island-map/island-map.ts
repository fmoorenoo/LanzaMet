import { Component, computed, input, output } from '@angular/core';
import { Mood } from '../../../core/insights/verdict.insight';
import { LocationId, SkyCondition } from '../../../core/models';
import { seeded } from '../../../shared/scene/geometry';
import { SkyGlyph } from '../../../shared/ui/sky-glyph/sky-glyph';
import {
  COAST_PATH,
  ISLAND_PATHS,
  LABEL_SIDE,
  MAP_SIZE,
  project,
  SWELL_MARKS,
} from './island-geometry';

export interface MapMarker {
  readonly id: LocationId;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly temperature: number;
  readonly sky: SkyCondition;
  readonly isDaylight: boolean;
  readonly mood: Mood;
  readonly headline: string;
}

/**
 * The island with each place pinned where it is. Markers are real buttons laid
 * over the drawing; the wind is drawn as gusts flowing across it, over the
 * land and under the labels.
 */
/**
 * One gust of wind on the map: a short, slightly curved stroke that fades in,
 * crosses the island and fades out. Each has its own height, length, pace,
 * opacity, sway and start, from a fixed seed, so they never move in step or
 * repeat as a pattern, and the same gusts come back on every visit.
 */
interface Gust {
  /** `--y` height (%), `--l` length (%), `--t` seconds per crossing, `--d` (negative)
   *  delay, `--o` opacity, `--dy` sway (rem), `--r` resting point (0–1) when still. */
  readonly style: string;
  readonly d: string;
}

const GUST_COUNT = 14;

/** Three gentle bends, so neighbouring gusts are not the same stroke. */
const GUST_PATHS = ['M0 6C22 2 52 10 100 5', 'M0 5C30 9 62 1 100 6', 'M0 7C18 4 46 4 100 6'];

function gusts(): readonly Gust[] {
  const random = seeded(20261024);
  const between = (min: number, max: number) => min + (max - min) * random();
  return Array.from({ length: GUST_COUNT }, (_, i) => {
    const t = between(11, 17);
    const values = {
      y: (((i * 0.6180339887 + 0.07) % 1) * 90 + 5 + between(-2, 2)).toFixed(1) + '%',
      l: between(12, 24).toFixed(1) + '%',
      t: t.toFixed(2) + 's',
      d: (-random() * t).toFixed(2) + 's',
      o: between(0.4, 0.8).toFixed(2),
      dy: between(-0.6, 0.6).toFixed(2) + 'rem',
      r: random().toFixed(2),
    };
    return {
      style: Object.entries(values)
        .map(([key, value]) => `--${key}:${value}`)
        .join(';'),
      d: GUST_PATHS[i % GUST_PATHS.length],
    };
  });
}

const GUSTS = gusts();

@Component({
  selector: 'qth-island-map',
  imports: [SkyGlyph],
  templateUrl: './island-map.html',
  styleUrl: './island-map.scss',
  host: { class: 'island-map' },
})
export class IslandMap {
  readonly markers = input.required<readonly MapMarker[]>();
  readonly selectedId = input<LocationId | null>(null);
  /** Direction the prevailing wind blows from, in degrees; null when calm. */
  readonly windFrom = input<number | null>(null);
  readonly pick = output<LocationId>();

  protected readonly size = MAP_SIZE;
  protected readonly paths = ISLAND_PATHS;
  protected readonly coast = COAST_PATH;
  protected readonly swell = SWELL_MARKS;
  protected readonly gusts = GUSTS;

  protected readonly placed = computed(() =>
    this.markers().map((m) => {
      const { x, y } = project({ latitude: m.latitude, longitude: m.longitude });
      return {
        ...m,
        left: (x / MAP_SIZE.width) * 100,
        top: (y / MAP_SIZE.height) * 100,
        side: LABEL_SIDE[m.id] ?? 'right',
      };
    }),
  );

  /**
   * Gusts travel west before rotation; turning them by (from − 90)° makes
   * them flow towards where the wind is going.
   */
  protected readonly windAngle = computed(() => {
    const from = this.windFrom();
    return from === null ? null : from - 90;
  });
}
