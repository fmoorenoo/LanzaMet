/** A colour in OKLCH: lightness 0–1, chroma, hue in degrees. */
export type Oklch = readonly [l: number, c: number, h: number];

export function oklch(l: number, c: number, h: number): Oklch {
  return [l, c, h];
}

/**
 * Perceptual mix through OKLab (straight line, not round the hue wheel), so
 * sand fading into night goes through grey instead of detouring via green.
 */
export function mix(a: Oklch, b: Oklch, t: number): Oklch {
  const ra = (a[2] * Math.PI) / 180;
  const rb = (b[2] * Math.PI) / 180;
  const l = a[0] + (b[0] - a[0]) * t;
  const x = a[1] * Math.cos(ra) + (b[1] * Math.cos(rb) - a[1] * Math.cos(ra)) * t;
  const y = a[1] * Math.sin(ra) + (b[1] * Math.sin(rb) - a[1] * Math.sin(ra)) * t;
  const h = (Math.atan2(y, x) * 180) / Math.PI;
  return [l, Math.hypot(x, y), h < 0 ? h + 360 : h];
}

export function toCss([l, c, h]: Oklch): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

function gamma(x: number): number {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

/** sRGB hex, for places that don't read OKLCH (the browser's theme-color). */
export function toHex([l, c, h]: Oklch): string {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = Math.pow(l + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m_ = Math.pow(l - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s_ = Math.pow(l - 0.0894841775 * a - 1.291485548 * b, 3);
  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
  return `#${[gamma(r), gamma(g), gamma(bl)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
