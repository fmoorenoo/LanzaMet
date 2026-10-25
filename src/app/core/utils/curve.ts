/*
 * Smooth curves through measured points without inventing anything between
 * them: monotone cubic interpolation (Fritsch–Carlson). Between two points the
 * curve never rises above the higher or dips below the lower, so it shows no
 * crest or trough the data does not have, and at a point where the data turns
 * (a high or a low) it is flat, as a tide is at the turn.
 */

export interface CurvePoint {
  readonly x: number;
  readonly y: number;
}

/** Tangent at each point, limited so no segment overshoots its ends. */
function tangents(points: readonly CurvePoint[]): number[] {
  const n = points.length;
  if (n < 2) return points.map(() => 0);
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    slopes.push(dx === 0 ? 0 : (points[i + 1].y - points[i].y) / dx);
  }
  const m: number[] = new Array(n);
  m[0] = slopes[0];
  m[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    // A turn (or a flat stretch) is flat; elsewhere, the harmonic mean of the
    // slopes either side, weighted by their widths (Fritsch–Butland).
    if (slopes[i - 1] * slopes[i] <= 0) {
      m[i] = 0;
    } else {
      const h0 = points[i].x - points[i - 1].x;
      const h1 = points[i + 1].x - points[i].x;
      const w0 = 2 * h1 + h0;
      const w1 = h1 + 2 * h0;
      m[i] = (w0 + w1) / (w0 / slopes[i - 1] + w1 / slopes[i]);
    }
  }
  // Ends: keep the end tangent from pointing past the next point.
  for (const [i, s] of [
    [0, slopes[0]],
    [n - 1, slopes[n - 2]],
  ] as const) {
    if (m[i] * s <= 0) m[i] = 0;
    else if (Math.abs(m[i]) > 3 * Math.abs(s)) m[i] = 3 * s;
  }
  return m;
}

/** Sorted by x, with points that share an x merged (the later one wins). */
function prepare(points: readonly CurvePoint[]): CurvePoint[] {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const out: CurvePoint[] = [];
  for (const p of sorted) {
    if (out.length > 0 && Math.abs(out[out.length - 1].x - p.x) < 1e-9) out[out.length - 1] = p;
    else out.push(p);
  }
  return out;
}

export interface MonotoneCurve {
  /** SVG path data: M, then one cubic Bézier per segment. */
  readonly path: string;
  /** The curve's height at `x` (clamped to the ends). */
  at(x: number): number;
  readonly points: readonly CurvePoint[];
}

export function monotoneCurve(input: readonly CurvePoint[], digits = 1): MonotoneCurve {
  const points = prepare(input);
  const m = tangents(points);
  const f = (n: number) => n.toFixed(digits);

  let path = '';
  if (points.length > 0) path = `M${f(points[0].x)} ${f(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const h = (b.x - a.x) / 3;
    path +=
      `C${f(a.x + h)} ${f(a.y + m[i] * h)} ` +
      `${f(b.x - h)} ${f(b.y - m[i + 1] * h)} ${f(b.x)} ${f(b.y)}`;
  }

  const at = (x: number): number => {
    if (points.length === 0) return 0;
    if (x <= points[0].x) return points[0].y;
    const last = points[points.length - 1];
    if (x >= last.x) return last.y;
    const i = points.findIndex((p) => p.x > x) - 1;
    const a = points[i];
    const b = points[i + 1];
    const h = b.x - a.x;
    const t = (x - a.x) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    // Cubic Hermite basis: the same curve the Bézier above draws.
    return (
      (2 * t3 - 3 * t2 + 1) * a.y +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * b.y +
      (t3 - t2) * h * m[i + 1]
    );
  };

  return { path, at, points };
}
