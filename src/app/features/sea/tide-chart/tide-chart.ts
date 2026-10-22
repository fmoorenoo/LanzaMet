import { Component, computed, input } from '@angular/core';
import { TideForecast } from '../../../core/models';
import { formatTime, TIME, toDate } from '../../../core/utils/time';

const W = 1000;
const H = 300;
// Room above the highs and below the lows for their labels.
const FLOOR = 222;
const TOP = 72;

/**
 * The tide across the island day: water fills the curve, the night is
 * shaded, highs and lows are named, and "now" is marked. The curve is drawn
 * in once when it appears, left to right, the way the day unfolds.
 */
@Component({
  selector: 'qth-tide-chart',
  templateUrl: './tide-chart.html',
  styleUrl: './tide-chart.scss',
})
export class TideChart {
  readonly tide = input.required<TideForecast>();
  readonly dayStart = input.required<Date>();
  readonly now = input.required<Date>();
  readonly sunrise = input.required<Date>();
  readonly sunset = input.required<Date>();

  protected readonly viewBox = `0 0 ${W} ${H}`;

  private x(t: Date): number {
    return ((t.getTime() - this.dayStart().getTime()) / (24 * TIME.HOUR)) * W;
  }

  private readonly maxHeight = computed(() =>
    Math.max(2.8, ...this.tide().extremes.map((e) => e.heightM + 0.2)),
  );

  private y(heightM: number): number {
    return FLOOR - (heightM / this.maxHeight()) * (FLOOR - TOP);
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

  protected readonly night = computed(() => ({
    morning: Math.max(0, this.x(this.sunrise())),
    evening: Math.min(W, this.x(this.sunset())),
  }));

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
        time: formatTime(e.time),
        height: e.heightM.toLocaleString('es-ES', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
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
  protected readonly nowTop = computed(() => (this.nowY() / H) * 100);
}
