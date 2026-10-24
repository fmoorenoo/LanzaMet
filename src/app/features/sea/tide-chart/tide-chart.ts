import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TideForecast } from '../../../core/models';
import { msg } from '../../../core/i18n/i18n.model';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { tideHeight } from '../../../core/insights/tide.insight';
import { TIME, toDate } from '../../../core/utils/time';

const W = 1000;
const H = 300;
// Room above the highs and below the lows for their labels.
const FLOOR = 222;
const TOP = 72;

/** Room the hour labels on the axis need beside "now", in px (half a label and a gap). */
const TICK_CLEARANCE_PX = 16;

/** Half the widest high or low label («Bajamar», «18:35 · −1,4 m»), in px, with a little air. */
const EXTREME_HALF_PX = 44;

/**
 * How far below its point a low's label ends, in px: it is moved down by its
 * own height (two lines of 0.75rem) and 0.5rem, so it ends two heights and the gap below.
 */
const EXTREME_DROP_PX = 2 * 34 + 8;

/** Gap between the chart and the axis, where the "now" pill sits (margin-top of .axis). */
const AXIS_GAP_PX = 8;

/** Air kept between a raised low label and the "now" pill, in px. */
const PILL_CLEARANCE_PX = 6;

/**
 * The tide across the island day: water fills the curve, the night is
 * shaded, highs and lows are named, and "now" is marked: the past fades, a
 * line falls from the point of the curve the water is at, and the time is
 * written where that line meets the axis. The curve is drawn in once when it
 * appears, left to right, the way the day unfolds.
 */
@Component({
  selector: 'lm-tide-chart',
  imports: [TranslatePipe],
  templateUrl: './tide-chart.html',
  styleUrl: './tide-chart.scss',
  host: { class: 'tide-chart' },
})
export class TideChart {
  readonly tide = input.required<TideForecast>();
  readonly dayStart = input.required<Date>();
  readonly now = input.required<Date>();
  /** Null when unknown: the night is then left unshaded. */
  readonly sunrise = input<Date | null>(null);
  readonly sunset = input<Date | null>(null);

  protected readonly viewBox = `0 0 ${W} ${H}`;

  /** Widths of the chart and of the "now" label, in px, to keep them clear of each other. */
  private readonly width = signal(0);
  private readonly labelWidth = signal(0);
  private readonly chartHeight = signal(0);
  private readonly nowLabel = viewChild.required<ElementRef<HTMLElement>>('nowLabel');

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const measure = () => {
        this.width.set(host.clientWidth);
        this.labelWidth.set(this.nowLabel().nativeElement.offsetWidth);
        this.chartHeight.set(host.querySelector<HTMLElement>('.chart')?.clientHeight ?? 0);
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(host);
      observer.observe(this.nowLabel().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private x(t: Date): number {
    return ((t.getTime() - this.dayStart().getTime()) / (24 * TIME.HOUR)) * W;
  }

  /**
   * Vertical range. Heights on a chart datum start at zero; around mean sea
   * level the water goes both ways, so the range follows the extremes.
   */
  private readonly range = computed(() => {
    const heights = this.tide().extremes.map((e) => e.heightM);
    if (this.tide().datum === 'chart') {
      return { min: 0, max: Math.max(2.8, ...heights.map((h) => h + 0.2)) };
    }
    return { min: Math.min(...heights) - 0.2, max: Math.max(...heights) + 0.2 };
  });

  private y(heightM: number): number {
    const { min, max } = this.range();
    return FLOOR - ((heightM - min) / (max - min)) * (FLOOR - TOP);
  }

  private readonly points = computed(() => {
    const start = this.dayStart().getTime();
    const end = start + 24 * TIME.HOUR;
    return this.tide()
      .series.filter((p) => {
        const t = toDate(p.time).getTime();
        return t >= start && t <= end;
      })
      .map((p) => ({ x: this.x(toDate(p.time)), y: this.y(p.heightM) }));
  });

  protected readonly line = computed(() =>
    this.points()
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(''),
  );

  protected readonly area = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return '';
    return `${this.line()}L${pts[pts.length - 1].x.toFixed(1)} ${H}L${pts[0].x.toFixed(1)} ${H}Z`;
  });

  protected readonly nowX = computed(() => Math.min(W, Math.max(0, this.x(this.now()))));

  protected readonly nowY = computed(() => {
    const pts = this.points();
    const x = this.nowX();
    const i = pts.findIndex((p) => p.x >= x);
    if (i <= 0) return pts[0]?.y ?? FLOOR;
    const a = pts[i - 1];
    const b = pts[i];
    return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
  });

  protected readonly night = computed(() => {
    const sunrise = this.sunrise();
    const sunset = this.sunset();
    if (!sunrise || !sunset) return null;
    return {
      morning: Math.max(0, this.x(sunrise)),
      evening: Math.min(W, this.x(sunset)),
    };
  });

  protected readonly labels = computed(() => {
    const start = this.dayStart().getTime();
    const end = start + 24 * TIME.HOUR;
    return this.tide()
      .extremes.filter((e) => {
        const t = toDate(e.time).getTime();
        return t >= start && t < end;
      })
      .map((e) => ({
        kind: e.kind,
        name: msg(`tide.kind.${e.kind}`),
        time: e.time,
        height: tideHeight(e.heightM, this.tide().datum),
        left: (this.x(toDate(e.time)) / W) * 100,
        top: (this.y(e.heightM) / H) * 100,
      }));
  });

  protected readonly ticks = [
    { label: '00', left: 0 },
    { label: '06', left: 25 },
    { label: '12', left: 50 },
    { label: '18', left: 75 },
    { label: '24', left: 100 },
  ];

  protected readonly nowLeft = computed(() => (this.nowX() / W) * 100);

  /** Half the label as a share of the chart; until measured, a phone's worth. */
  private readonly labelHalf = computed(() => {
    const width = this.width();
    return width > 0 ? (this.labelWidth() / 2 / width) * 100 : 15;
  });

  /** The label centred under the line, but never past either end of the axis. */
  protected readonly nowLabelLeft = computed(() => {
    const half = this.labelHalf();
    return Math.min(100 - half, Math.max(half, this.nowLeft()));
  });

  /** Hour labels the "now" label would cover step aside. */
  protected readonly visibleTicks = computed(() => {
    const width = this.width() || 360;
    const reach = this.labelHalf() + (TICK_CLEARANCE_PX / width) * 100;
    return this.ticks.map((tick) => ({
      ...tick,
      covered: Math.abs(tick.left - this.nowLabelLeft()) < reach,
    }));
  });

  /**
   * A low's label hangs below its point. A deep low's label reaches the axis,
   * where the "now" pill is: if it would sit on the pill, it rises just enough
   * to clear it, still under its point. Nothing moves while they are apart.
   */
  protected readonly placedLabels = computed(() => {
    const width = this.width() || 360;
    const height = this.chartHeight();
    const reach = this.labelHalf() + (EXTREME_HALF_PX / width) * 100;
    return this.labels().map((label) => {
      const beside = Math.abs(label.left - this.nowLabelLeft()) < reach;
      const bottom = (label.top / 100) * height + EXTREME_DROP_PX;
      const overlap = bottom + PILL_CLEARANCE_PX - (height + AXIS_GAP_PX);
      const raise = label.kind !== 'pleamar' && beside && height > 0 && overlap > 0 ? overlap : 0;
      return { ...label, raise };
    });
  });

  protected readonly nowTop = computed(() => (this.nowY() / H) * 100);
}
