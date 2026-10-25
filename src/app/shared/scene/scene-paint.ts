import { mix, Oklch, oklch, parseOklch, toRgb } from '../../core/utils/color';
import {
  CLOUD_PATHS,
  CLOUD_SHADE_FROM,
  CLOUDS,
  HORIZON_VIEWBOX,
  horizonPaths,
  RAIN_DROPS,
  rainDropCount,
  shorePath,
  STARS,
  WAVE_VIEWBOX,
  wavePaths,
} from './geometry';
import { afloatFor, cloudOpacity, glintFor, visibleClouds } from './layers';
import { SceneState } from './scene-state';
import { AFLOAT_PATHS, sceneryArt } from './scenery';

/**
 * Where and how big a still scene is painted on a canvas.
 *
 * `unit` is canvas pixels per CSS pixel of the live scene it stands for, so
 * hairlines (rain, foam, the glint's lines) keep the weight they have on a
 * phone. `landScale` is canvas pixels per unit of the 1200×150 horizon box,
 * anchored to the right like the live scene's `xMaxYMax slice`.
 */
export interface SceneBox {
  readonly width: number;
  readonly height: number;
  /** Where the sea starts, 0–1 of the height. */
  readonly horizon: number;
  readonly unit: number;
  readonly landScale: number;
}

type Ctx = CanvasRenderingContext2D;

const WHITE: Oklch = oklch(1, 0, 0);
const SUN_CORE: Oklch = oklch(1, 0.01, 95);
const MOON: Oklch = oklch(0.95, 0.035, 95);
const HAZE_HIGH: Oklch = oklch(0.86, 0.05, 78);
const HAZE_LOW: Oklch = oklch(0.84, 0.05, 76);
/** The glint's own pulse runs 0.55 → 0.85; a still picture takes the middle. */
const GLINT_REST = 0.7;
/** The rain's single slant (see scene.scss): 40 across for every 60 down. */
const RAIN_SLANT = -0.6667;
const RAIN_TURN = (33.69 * Math.PI) / 180;

const paint = (css: string, alpha = 1) => toRgb(parseOklch(css), alpha);

/**
 * The scene as a still picture: the live drawing's layers, colours and
 * geometry, with everything that drifts (clouds, swell, boats, rain) at the
 * resting place it has in cards and under reduced motion. Never a frame
 * caught mid-animation: the same state always paints the same picture.
 */
export function paintScene(ctx: Ctx, s: SceneState, box: SceneBox): void {
  const { width: w, height: h } = box;
  const horizonY = h * box.horizon;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();

  paintSky(ctx, s, box, horizonY);
  paintGlow(ctx, s, box, horizonY);
  paintLights(ctx, s, box, horizonY);
  paintClouds(ctx, s, box, horizonY);
  withLand(ctx, box, horizonY, () => paintFarLand(ctx, s));
  paintMist(ctx, s, box, horizonY);
  withLand(ctx, box, horizonY, () => paintLand(ctx, s));
  paintHaze(ctx, s, box);
  paintSea(ctx, s, box, horizonY);
  withLand(ctx, box, horizonY, () => paintAfloat(ctx, s));
  paintRain(ctx, s, box);

  ctx.restore();
}

function paintSky(
  ctx: Ctx,
  s: SceneState,
  { width: w, height: h, horizon }: SceneBox,
  horizonY: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, paint(s.sky.top));
  sky.addColorStop(0.34, paint(s.sky.mid));
  sky.addColorStop(Math.max(0.34, horizon - 0.1), paint(s.sky.mid));
  sky.addColorStop(horizon, paint(s.sky.low));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  if (s.stars > 0.01) {
    // Round, sized to the sky's height: a phone's sky, where the live stars barely stretch.
    ctx.fillStyle = toRgb(WHITE, 0.8 * s.stars);
    for (const [x, y, r] of STARS) {
      ctx.beginPath();
      ctx.arc((x / 100) * w, (y / 100) * horizonY, (r / 100) * horizonY, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** The band of light along the horizon (`.glow`). */
function paintGlow(ctx: Ctx, s: SceneState, { width: w }: SceneBox, horizonY: number) {
  if (s.glow.strength <= 0.01) return;
  const color = parseOklch(s.glow.color);
  const top = horizonY * (1 - 0.46);
  const band = ctx.createLinearGradient(0, horizonY, 0, top);
  band.addColorStop(0, toRgb(color, 0.72));
  band.addColorStop(0.38, toRgb(color, 0.26));
  band.addColorStop(1, toRgb(color, 0));
  ctx.save();
  ctx.globalAlpha = s.glow.strength;
  ctx.fillStyle = band;
  ctx.fillRect(0, top, w, horizonY - top);
  ctx.restore();
}

function paintLights(ctx: Ctx, s: SceneState, { width: w }: SceneBox, horizonY: number) {
  if (s.sun.visible > 0.01) {
    const x = (s.sun.x / 100) * w;
    const y = (s.sun.y / 100) * horizonY;
    const size = w * (s.sun.lowSun ? 0.19 : 0.15);
    const color = parseOklch(s.sun.color);
    ctx.save();
    ctx.globalAlpha = s.sun.visible;
    // The bloom (`.bloom`): a wide, faint patch of scattered light.
    const reach = Math.min(w * 0.7, 640 * (w / 1200) * 1.6) / 2;
    const bloom = ctx.createRadialGradient(x, y, 0, x, y, reach * Math.SQRT2);
    bloom.addColorStop(0, toRgb(color, 0.34));
    bloom.addColorStop(0.34, toRgb(color, 0.1));
    bloom.addColorStop(0.66, toRgb(color, 0));
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(x, y, reach, 0, Math.PI * 2);
    ctx.fill();
    // CSS's `radial-gradient(circle, …)` reaches the box's corner; the disc clips it.
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * Math.SQRT1_2);
    glow.addColorStop(0, toRgb(SUN_CORE));
    glow.addColorStop(0.14, toRgb(SUN_CORE));
    glow.addColorStop(0.22, toRgb(mix(color, WHITE, 0.4)));
    glow.addColorStop(0.255, toRgb(color));
    glow.addColorStop(0.27, toRgb(color, 0.42));
    glow.addColorStop(0.42, toRgb(color, 0.16));
    glow.addColorStop(0.7, toRgb(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (s.moon.visible > 0.01) {
    const x = (s.moon.x / 100) * w;
    const y = (s.moon.y / 100) * horizonY;
    const size = w * 0.07;
    const r = size / 2;
    ctx.save();
    ctx.globalAlpha = s.moon.visible;

    // The soft halo lies outside the disc only, like the CSS box-shadow.
    ctx.save();
    const outside = new Path2D();
    outside.rect(x - size * 3, y - size * 3, size * 6, size * 6);
    outside.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip(outside, 'evenodd');
    ctx.shadowColor = toRgb(MOON, 0.25);
    ctx.shadowBlur = size * 0.9;
    ctx.shadowOffsetX = size * 20;
    ctx.fillStyle = toRgb(MOON);
    ctx.beginPath();
    ctx.arc(x - size * 20, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // The crescent: the disc less itself moved by the inset shadow's offset.
    const disc = new Path2D();
    disc.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip(disc);
    const lit = new Path2D();
    lit.rect(x - size, y - size, size * 2, size * 2);
    lit.arc(x - size * 0.275, y + size * 0.1, r, 0, Math.PI * 2);
    ctx.fillStyle = toRgb(MOON);
    ctx.fill(lit, 'evenodd');
    ctx.restore();
  }
}

function paintClouds(ctx: Ctx, s: SceneState, { width: w }: SceneBox, horizonY: number) {
  const visible = visibleClouds(s, false);
  if (visible === 0) return;
  const paths = CLOUD_PATHS.map((d) => new Path2D(d));
  CLOUDS.forEach((cloud, i) => {
    const opacity = cloudOpacity(s, i, visible);
    if (opacity <= 0) return;
    const width = (cloud.width / 100) * w;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate((cloud.rest / 100) * w, (cloud.top / 100) * horizonY);
    ctx.scale(width / 200, width / 200);
    // Lit top, shaded base, over the shape's own height (objectBoundingBox in the SVG).
    const top = CLOUD_TOPS[cloud.shape];
    const shade = ctx.createLinearGradient(0, top, 0, 70);
    shade.addColorStop(0, paint(s.cloud));
    shade.addColorStop(CLOUD_SHADE_FROM, paint(s.cloud));
    shade.addColorStop(1, paint(s.cloudShade));
    ctx.fillStyle = shade;
    ctx.fill(paths[cloud.shape]);
    ctx.restore();
  });
}

/** Highest point of each cloud shape, in its 200×80 box: where its gradient starts. */
const CLOUD_TOPS = CLOUD_PATHS.map((d) =>
  Math.min(...[...d.matchAll(/-?\d+(?:\.\d+)?/g)].filter((_, i) => i % 2 === 1).map(Number)),
);

function paintFarLand(ctx: Ctx, s: SceneState) {
  const { far } = horizonPaths(s.horizon);
  if (!far) return;
  const fade = ctx.createLinearGradient(0, 0, 0, HORIZON_VIEWBOX.height);
  fade.addColorStop(0.15, paint(s.land.far));
  fade.addColorStop(1, paint(s.land.farMist));
  ctx.fillStyle = fade;
  ctx.fill(new Path2D(far));
}

/** The mist at the far range's foot (`.mist`). */
function paintMist(ctx: Ctx, s: SceneState, { width: w, height: h }: SceneBox, horizonY: number) {
  const depth = Math.min(Math.max(h * 0.06, 16), 52);
  const color = parseOklch(s.sky.low);
  const mist = ctx.createLinearGradient(0, horizonY, 0, horizonY - depth);
  mist.addColorStop(0, toRgb(color, 0.62));
  mist.addColorStop(1, toRgb(color, 0));
  ctx.fillStyle = mist;
  ctx.fillRect(0, horizonY - depth, w, depth);
}

/** Runs `draw` in the horizon's 1200×150 units, its bottom right on the waterline's right end. */
function withLand(ctx: Ctx, box: SceneBox, horizonY: number, draw: () => void) {
  const k = box.landScale;
  ctx.save();
  ctx.translate(box.width - HORIZON_VIEWBOX.width * k, horizonY - HORIZON_VIEWBOX.height * k);
  ctx.scale(k, k);
  draw();
  ctx.restore();
}

function fillPath(ctx: Ctx, d: string, color: string) {
  if (!d) return;
  ctx.fillStyle = color;
  ctx.fill(new Path2D(d));
}

function paintLand(ctx: Ctx, s: SceneState) {
  const horizon = horizonPaths(s.horizon);
  const art = sceneryArt(s.scenery);
  // Near land catches light along its top (the SVG's bounding-box gradient,
  // close enough over the horizon's 150 units for a still picture).
  const near = ctx.createLinearGradient(0, HORIZON_VIEWBOX.height * 0.3, 0, HORIZON_VIEWBOX.height);
  near.addColorStop(0, paint(s.land.nearTop));
  near.addColorStop(0.7, paint(s.land.near));
  for (const d of [horizon.near, art.terrain]) {
    if (!d) continue;
    ctx.fillStyle = near;
    ctx.fill(new Path2D(d));
  }
  fillPath(ctx, art.beach, paint(s.shore));
  art.strata.forEach((band, i) => fillPath(ctx, band, paint(s.built.rock[i % 3])));
  fillPath(ctx, art.lagoon, paint(s.built.lagoon));
  fillPath(ctx, art.accent, paint(s.built.accent));
  fillPath(ctx, art.accentShade, paint(s.built.accentShade));
  if (art.walls) {
    // Glass first: a tower's floor lines and edges are walls drawn over it.
    fillPath(ctx, art.glass, paint(s.built.glass));
    fillPath(ctx, art.walls, paint(s.built.wall));
    fillPath(ctx, art.shade, paint(s.built.shade));
    fillPath(ctx, art.windows, paint(s.built.window));
  }
  if (art.trunks) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = paint(s.built.palm);
    ctx.lineWidth = 2.4;
    ctx.stroke(new Path2D(art.trunks));
    ctx.lineWidth = 1.5;
    ctx.stroke(new Path2D(art.fronds));
    ctx.restore();
  }
  if (s.built.lights > 0.01) {
    for (const lamp of art.lamps) {
      ctx.fillStyle = paint(s.built.lamp, s.built.lights * 0.3);
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = paint(s.built.lamp, s.built.lights);
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function paintHaze(ctx: Ctx, s: SceneState, { width: w, height: h, horizon }: SceneBox) {
  if (s.haze <= 0.01) return;
  const haze = ctx.createLinearGradient(0, 0, 0, h);
  haze.addColorStop(0, toRgb(HAZE_HIGH, 0));
  haze.addColorStop(0.3, toRgb(HAZE_HIGH, 0.35));
  haze.addColorStop(horizon, toRgb(HAZE_HIGH, 0.7));
  haze.addColorStop(Math.max(horizon, 0.8), toRgb(HAZE_LOW, 0.25));
  haze.addColorStop(1, toRgb(HAZE_LOW, 0));
  ctx.save();
  ctx.globalAlpha = s.haze;
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function paintSea(ctx: Ctx, s: SceneState, box: SceneBox, horizonY: number) {
  const { width: w, height: h, unit } = box;
  const seaH = h - horizonY;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizonY, w, seaH);
  ctx.clip();

  const sea = ctx.createLinearGradient(0, horizonY, 0, h);
  sea.addColorStop(0, paint(s.sea.horizon));
  sea.addColorStop(0.24, paint(s.sea.far));
  sea.addColorStop(1, paint(s.sea.near));
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizonY, w, seaH);
  // The seam of light where sea meets sky.
  ctx.fillStyle = paint(s.glow.color, 0.35 + s.glow.strength * 0.5);
  ctx.fillRect(0, horizonY, w, unit);

  paintGlint(ctx, s, box, horizonY);

  const waves = [
    wavePaths(s.seaLevel, 150, 0.45),
    wavePaths(s.seaLevel, 240, 0.75),
    wavePaths(s.seaLevel, 300, 1),
  ];
  // Each swell is drawn twice the scene's width, resting where its loop starts.
  const swell = (top: number, height: number, shift: number) => {
    const boxH = height * seaH;
    return new DOMMatrix()
      .translate(0, horizonY + top * seaH + shift * boxH)
      .scale((w * 2) / WAVE_VIEWBOX.width, boxH / WAVE_VIEWBOX.height);
  };
  const fillIn = (d: string, matrix: DOMMatrix, color: string) => {
    const path = new Path2D();
    path.addPath(new Path2D(d), matrix);
    ctx.fillStyle = color;
    ctx.fill(path);
  };

  const sheen = (d: string, matrix: DOMMatrix, opacity: number) => {
    const path = new Path2D();
    path.addPath(new Path2D(d), matrix);
    ctx.strokeStyle = paint(s.sea.sheen, opacity);
    ctx.lineWidth = unit;
    ctx.stroke(path);
  };

  /** A vertical gradient over a swell's own box (the SVG's objectBoundingBox). */
  const across = (top: number, height: number, shift: number, stops: [number, string][]) => {
    const boxH = height * seaH;
    const y0 = horizonY + top * seaH + shift * boxH;
    const gradient = ctx.createLinearGradient(0, y0, 0, y0 + boxH);
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    return gradient;
  };
  const fadeIn = (d: string, matrix: DOMMatrix, fill: CanvasGradient) => {
    const path = new Path2D();
    path.addPath(new Path2D(d), matrix);
    ctx.fillStyle = fill;
    ctx.fill(path);
  };

  fadeIn(
    waves[0].body,
    swell(0.03, 0.32, 0),
    across(0.03, 0.32, 0, [
      [0.1, paint(s.sea.swellFar)],
      [0.75, paint(s.sea.swellFar, 0)],
    ]),
  );
  sheen(waves[0].crest, swell(0.03, 0.32, 0), s.sea.sheenOpacity);
  fadeIn(
    waves[1].body,
    swell(0.2, 0.42, 0),
    across(0.2, 0.42, 0, [
      [0.1, paint(s.sea.swellMid)],
      [0.8, paint(s.sea.swellMid, 0)],
    ]),
  );
  sheen(waves[1].crest, swell(0.2, 0.42, 0), s.sea.sheenOpacity * 0.8);
  fillIn(
    shorePath(s.shoreKind),
    new DOMMatrix().translate(0, horizonY + 0.3 * seaH).scale(w / 100, (0.7 * seaH) / 100),
    paint(s.shore),
  );

  // The waterline rises and falls with the tide; the foam keeps its hairline weight.
  const tideShift = (0.5 - s.tide) * 0.3;
  const front = swell(0.46, 0.74, tideShift);
  fadeIn(
    waves[2].body,
    front,
    across(0.46, 0.74, tideShift, [
      [0.18, paint(s.sea.shallowTop)],
      [0.5, paint(s.sea.shallow)],
      [1, paint(s.sea.near)],
    ]),
  );
  const crest = new Path2D();
  crest.addPath(new Path2D(waves[2].crest), front);
  ctx.strokeStyle = toRgb(WHITE, s.sea.foam);
  ctx.lineWidth = 2 * unit;
  ctx.stroke(crest);

  ctx.restore();
}

/** Lines of light on the water under the sun or moon, fading out from the horizon. */
function paintGlint(
  ctx: Ctx,
  s: SceneState,
  { width: w, height: h, unit }: SceneBox,
  horizonY: number,
) {
  const glint = glintFor(s);
  if (glint.opacity <= 0.01) return;
  const seaH = h - horizonY;
  const gw = Math.round(w * 0.18);
  const gh = Math.round(seaH * 0.46);
  if (gw < 1 || gh < 1) return;

  const layer = document.createElement('canvas');
  layer.width = gw;
  layer.height = gh;
  const g = layer.getContext('2d');
  if (!g) return;
  g.fillStyle = paint(glint.color);
  for (let y = 0; y < gh; y += 7 * unit) g.fillRect(0, y, gw, 1.5 * unit);
  // `radial-gradient(ellipse 50% 100% at 50% 0%, black 10%, transparent 72%)`
  g.globalCompositeOperation = 'destination-in';
  g.save();
  g.translate(gw / 2, 0);
  g.scale(1, gh / (gw / 2));
  const mask = g.createRadialGradient(0, 0, 0, 0, 0, gw / 2);
  mask.addColorStop(0.1, 'rgb(0 0 0)');
  mask.addColorStop(0.72, 'rgb(0 0 0 / 0)');
  g.fillStyle = mask;
  // In the squashed space the layer's full height is half its width.
  g.fillRect(-gw / 2, 0, gw, gw / 2);
  g.restore();

  ctx.save();
  ctx.globalAlpha = glint.opacity * GLINT_REST;
  ctx.drawImage(layer, (glint.x / 100) * w - gw / 2, horizonY + seaH * 0.01);
  ctx.restore();
}

function paintAfloat(ctx: Ctx, s: SceneState) {
  const art = sceneryArt(s.scenery);
  fillPath(ctx, art.breakwater, paint(s.land.near));
  for (const item of afloatFor(art, s)) {
    const shape = AFLOAT_PATHS[item.kind];
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(item.scale, item.scale);
    if (item.kind === 'breaker') {
      fillPath(ctx, shape.hull, paint(s.sea.swellMid));
      fillPath(ctx, shape.top, paint(s.built.wall));
    } else if (item.kind === 'sail') {
      fillPath(ctx, shape.hull, paint(s.built.wall));
      fillPath(ctx, shape.top, paint(s.built.sails[item.tone]));
    } else {
      fillPath(ctx, shape.hull, paint(s.built.wall));
      fillPath(ctx, shape.top, paint(s.built.wall));
      fillPath(ctx, shape.stripe, paint(s.built.trim));
    }
    ctx.restore();
  }
}

/** Streaks resting part-way through their fall, as in cards and under reduced motion. */
function paintRain(ctx: Ctx, s: SceneState, { width: w, height: h, unit }: SceneBox) {
  if (!s.rain) return;
  const count = rainDropCount(s.rainIntensity, false);
  // A phone-sized scene hides every third streak (the CSS container query).
  const narrow = w / unit < 640;
  RAIN_DROPS.slice(0, count).forEach(({ still }, i) => {
    if (narrow && (i + 1) % 3 === 0) return;
    const dw = still.w * unit;
    const dl = still.l * unit;
    const cx = still.x * (w + 0.6667 * h) + dw / 2 + still.p * h * RAIN_SLANT;
    const cy = dl / 2 + still.p * h;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(RAIN_TURN);
    const streak = ctx.createLinearGradient(0, -dl / 2, 0, dl / 2);
    streak.addColorStop(0, toRgb(WHITE, 0));
    streak.addColorStop(1, toRgb(WHITE, still.o));
    ctx.fillStyle = streak;
    ctx.beginPath();
    ctx.roundRect(-dw / 2, -dl / 2, dw, dl, dw / 2);
    ctx.fill();
    ctx.restore();
  });
}
