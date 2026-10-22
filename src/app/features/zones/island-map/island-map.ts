import { Component, computed, input, output } from '@angular/core';
import { Mood } from '../../../core/insights/verdict.insight';
import { LocationId, SkyCondition } from '../../../core/models';
import { SkyGlyph } from '../../../shared/ui/sky-glyph/sky-glyph';
import { ISLAND_PATHS, LABEL_SIDE, MAP_SIZE, project } from './island-geometry';

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
 * over the drawing; the wind is drawn as slow streaks flowing across it.
 */
@Component({
  selector: 'qth-island-map',
  imports: [SkyGlyph],
  templateUrl: './island-map.html',
  styleUrl: './island-map.scss',
})
export class IslandMap {
  readonly markers = input.required<readonly MapMarker[]>();
  readonly selectedId = input<LocationId | null>(null);
  /** Direction the prevailing wind blows from, in degrees; null when calm. */
  readonly windFrom = input<number | null>(null);
  readonly pick = output<LocationId>();

  protected readonly size = MAP_SIZE;
  protected readonly paths = ISLAND_PATHS;
  protected readonly streaks = [50, 150, 250, 350, 450, 550, 650, 750, 850, 950];

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
   * Streaks slide west before rotation; turning them by (from − 90)° makes
   * them flow towards where the wind is going.
   */
  protected readonly windAngle = computed(() => {
    const from = this.windFrom();
    return from === null ? null : from - 90;
  });
}
