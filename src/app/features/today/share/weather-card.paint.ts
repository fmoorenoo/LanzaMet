import { Lang, MessageKey, msg, Msg } from '../../../core/i18n/i18n.model';
import { formatLongDate, translate } from '../../../core/i18n/translate';
import { skyPhrase } from '../../../core/insights/sky.insight';
import { mix, Oklch, oklch, toRgb } from '../../../core/utils/color';
import { formatTime } from '../../../core/utils/time';
import { paintScene } from '../../../shared/scene/scene-paint';
import { IconName } from '../../../shared/ui/icon/icons';
import { paintIcon } from '../../../shared/ui/icon/paint-icon';
import { GlyphTone, glyphParts } from '../../../shared/ui/sky-glyph/sky-glyph';
import { WeatherCard } from './weather-card';

/*
 * The card people send: the place's scene with the answer written on its
 * sky, as in the Today hero, and a sheet beneath with the sky, wind, sea and
 * tide, as in the page below it. Drawn on a canvas from the same geometry,
 * colours and type as the app, never captured from the screen.
 *
 * 4:5 at 1200 × 1500: the portrait shape WhatsApp and social feeds show
 * whole, sharp on a 3× phone screen.
 */

export const CARD_SIZE = { width: 1200, height: 1500 } as const;

export interface CardOptions {
  readonly lang: Lang;
  /** The link the message carries; its host is printed on the card. */
  readonly link: string | null;
  /** The demo build says its data are made up, on the card too. */
  readonly demo: boolean;
}

const W = CARD_SIZE.width;
const H = CARD_SIZE.height;
const PAD = 76;
const RADIUS = 56;
/** Canvas px per CSS px: the card reads like a 480 px wide phone, at 2.5×. */
const UNIT = 2.5;
const FONT = "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif";
const WEIGHTS = [300, 460, 560, 640, 680, 700] as const;

// Tokens from _tokens.scss, as numbers a canvas can paint.
interface Palette {
  readonly surface: Oklch;
  readonly ink: Oklch;
  readonly ink2: Oklch;
  readonly ink3: Oklch;
  readonly accent: Oklch;
  readonly accentSoft: number;
  readonly line: Oklch;
  readonly cloudFill: Oklch;
  readonly rain: Oklch;
}

const DAY: Palette = {
  surface: oklch(0.984, 0.004, 230),
  ink: oklch(0.21, 0.01, 55),
  ink2: oklch(0.42, 0.014, 55),
  ink3: oklch(0.5, 0.013, 55),
  accent: oklch(0.43, 0.09, 162),
  accentSoft: 0.1,
  line: oklch(0.21, 0.01, 55),
  cloudFill: oklch(1, 0, 0),
  rain: oklch(0.52, 0.13, 240),
};

// The volcanic night of the app's dark theme, for cards drawn after dark.
const NIGHT: Palette = {
  surface: oklch(0.21, 0.022, 258),
  ink: oklch(0.965, 0.006, 90),
  ink2: oklch(0.82, 0.014, 258),
  ink3: oklch(0.72, 0.016, 258),
  accent: oklch(0.82, 0.1, 162),
  accentSoft: 0.14,
  line: oklch(0.96, 0.01, 258),
  cloudFill: oklch(0.255, 0.024, 258),
  rain: oklch(0.66, 0.11, 232),
};

const SKY_INK = { light: oklch(0.99, 0.004, 90), dark: oklch(0.21, 0.01, 55) } as const;
const HALO = oklch(0.18, 0.05, 262);
const SHADE = oklch(0.16, 0.04, 262);
const SUN = oklch(0.85, 0.15, 82);
const SUN_EDGE = oklch(0.72, 0.15, 70);
const MOON = oklch(0.86, 0.06, 95);
const HEAT = oklch(0.6, 0.16, 40);
const BRAND_TILE = oklch(0.36, 0.1, 248);
const BRAND_SEA = oklch(0.52, 0.13, 240);
const BRAND_WAVE =
  'M0 19.5c2.7 0 3.3-1.8 6-1.8s3.3 1.8 6 1.8 3.3-1.8 6-1.8 3.3 1.8 6 1.8 3.3-1.8 6-1.8 2 .9 2 .9V32H0z';

type Ctx = CanvasRenderingContext2D;

/** Loads the weights the card uses, so the first card is never drawn in a fallback face. */
export async function loadCardFonts(doc: Document): Promise<void> {
  if (!doc.fonts) return;
  await Promise.all(
    WEIGHTS.map((weight) => doc.fonts.load(`${weight} 48px ${FONT}`, 'LanzaMet 0123456789°')),
  );
}

export async function renderWeatherCard(
  doc: Document,
  card: WeatherCard,
  options: CardOptions,
): Promise<Blob | null> {
  await loadCardFonts(doc);
  const canvas = doc.createElement('canvas');
  drawWeatherCard(canvas, card, options);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export function drawWeatherCard(
  canvas: HTMLCanvasElement,
  card: WeatherCard,
  options: CardOptions,
): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D canvas');
  const t = (text: Msg | MessageKey) => translate(text, options.lang);
  const palette = card.scene.daylight < 0.4 ? NIGHT : DAY;

  const sheet = layoutSheet(ctx, cardCells(card, t));
  const sheetTop = H - sheet.height;
  const sky = layoutSky(ctx, card, t, options.lang);

  // The sea keeps a band of its own above the sheet; the words stay on the sky.
  const sceneH = sheetTop + RADIUS;
  const horizonY = Math.min(sheetTop - 120, Math.max(sky.bottom + 64, sheetTop - 240));
  paintScene(ctx, card.scene, {
    width: W,
    height: sceneH,
    horizon: horizonY / sceneH,
    unit: UNIT,
    landScale: W / 900,
  });

  const lightInk = card.scene.ink === 'light';
  if (lightInk) {
    // The hero's shade: light words stay legible over bright cloud.
    const shade = ctx.createLinearGradient(0, 0, 0, sceneH * 0.75);
    shade.addColorStop(0, toRgb(SHADE, 0.36));
    shade.addColorStop(0.6, toRgb(SHADE, 0.3));
    shade.addColorStop(1, toRgb(SHADE, 0));
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, sceneH * 0.75);
  }
  paintSky(ctx, sky, lightInk ? SKY_INK.light : SKY_INK.dark, lightInk);
  paintSheet(ctx, sheet, sheetTop, palette, card, options, t);
}

// ── Type ─────────────────────────────────────────────────────────────

function setFont(ctx: Ctx, weight: number, size: number, tracking = 0): void {
  ctx.font = `${weight} ${size}px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${(tracking * size).toFixed(2)}px`;
}

function ellipsize(ctx: Ctx, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/** A number stays with its unit ("23 °C", "39 min"), and a "·" with the word before it. */
function keepTogether(text: string): string {
  return text.replace(/(\d) (?=(°C|km\/h|cm|min|h|m|s)(?![\p{L}]))/gu, '$1 ').replace(/ ·/g, ' ·');
}

/** Words into lines no wider than `max`; what does not fit in `lines` ends in an ellipsis. */
function wrap(ctx: Ctx, text: string, max: number, lines: number): string[] {
  const out: string[] = [];
  let current = '';
  // Plain spaces only: the no-break ones hold their words together.
  for (const word of keepTogether(text.trim()).split(/ +/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || ctx.measureText(candidate).width <= max) current = candidate;
    else {
      out.push(current);
      current = word;
    }
  }
  if (current) out.push(current);
  if (out.length <= lines) return out.map((line) => ellipsize(ctx, line, max));
  const kept = out.slice(0, lines);
  kept[lines - 1] = ellipsize(ctx, `${kept[lines - 1]} ${out.slice(lines).join(' ')}`, max);
  return kept;
}

interface TextRun {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly weight: number;
  readonly size: number;
  readonly tracking: number;
  readonly alpha: number;
}

const run = (
  text: string,
  x: number,
  y: number,
  weight: number,
  size: number,
  tracking = 0,
  alpha = 1,
): TextRun => ({ text, x, y, weight, size, tracking, alpha });

// ── The sky: place, moment, temperature and the answer ──────────────

interface Pill {
  readonly x: number;
  readonly width: number;
  readonly fill: number;
  readonly runs: readonly TextRun[];
  readonly icon: IconName | null;
}

interface SkyLayout {
  readonly pills: readonly Pill[];
  readonly runs: readonly TextRun[];
  readonly bottom: number;
}

const PILL_H = 84;

function layoutSky(
  ctx: Ctx,
  card: WeatherCard,
  t: (m: Msg | MessageKey) => string,
  lang: Lang,
): SkyLayout {
  const runs: TextRun[] = [];
  const mid = PAD + PILL_H / 2;

  // The moment, right: "Ahora 14:36" or "Previsión 18:00".
  const label = t(card.isNow ? 'common.now' : 'share.card.forecast');
  const time = formatTime(card.at);
  setFont(ctx, 520, 30);
  const labelW = ctx.measureText(label).width;
  setFont(ctx, 650, 44, -0.015);
  const timeW = ctx.measureText(time).width;
  const badgeW = 28 + labelW + 14 + timeW + 30;
  const badgeX = W - PAD - badgeW;
  const clock: Pill = {
    x: badgeX,
    width: badgeW,
    fill: 0.14,
    icon: null,
    runs: [
      run(label, badgeX + 28, mid + 11, 520, 30, 0, 0.82),
      run(time, badgeX + 28 + labelW + 14, mid + 15, 650, 44, -0.015),
    ],
  };

  // The place, left, in the hero's chip.
  setFont(ctx, 680, 38, -0.01);
  const room = badgeX - 20 - PAD - (26 + 34 + 12 + 34);
  const place = ellipsize(ctx, card.place, room);
  const placeW = 26 + 34 + 12 + ctx.measureText(place).width + 34;
  const chip: Pill = {
    x: PAD,
    width: placeW,
    fill: 0.2,
    icon: 'pin',
    runs: [run(place, PAD + 26 + 34 + 12, mid + 13, 680, 38, -0.01)],
  };

  // Day and date, then the temperature as the hero sets it.
  const dateY = PAD + PILL_H + 82;
  runs.push(run(formatLongDate(card.at, lang), PAD, dateY, 560, 36, -0.005, 0.9));

  setFont(ctx, 300, 236, -0.04);
  const digits = `${card.temperature}°`.replace('-', '−');
  const ascent = ctx.measureText('0123456789').actualBoundingBoxAscent || 236 * 0.7;
  const tempY = dateY + 44 + ascent;
  runs.push(run(digits, PAD - 8, tempY, 300, 236, -0.04));

  // The verdict, as large as it can be in two lines.
  const headline = t(card.verdict.headline);
  let size = 76;
  let lines: string[] = [];
  for (size of [76, 68, 60]) {
    setFont(ctx, 680, size, -0.03);
    lines = wrap(ctx, headline, 760, 2);
    if (!lines.some((l) => l.endsWith('…'))) break;
  }
  const verdictLead = Math.round(size * 1.06);
  let y = tempY + 40 + size * 0.74;
  for (const line of lines) {
    runs.push(run(line, PAD, y, 680, size, -0.03));
    y += verdictLead;
  }
  y = y - verdictLead + 62;

  setFont(ctx, 460, 34, -0.005);
  for (const line of wrap(ctx, t(card.verdict.sentence), 680, 2)) {
    runs.push(run(line, PAD, y, 460, 34, -0.005, 0.9));
    y += 46;
  }

  return { pills: [chip, clock], runs, bottom: y - 46 + 12 };
}

function paintRun(ctx: Ctx, r: TextRun, color: Oklch): void {
  setFont(ctx, r.weight, r.size, r.tracking);
  ctx.fillStyle = toRgb(color, r.alpha);
  ctx.fillText(r.text, r.x, r.y);
}

function paintSky(ctx: Ctx, sky: SkyLayout, ink: Oklch, halo: boolean): void {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  for (const pill of sky.pills) {
    ctx.beginPath();
    ctx.roundRect(pill.x, PAD, pill.width, PILL_H, PILL_H / 2);
    ctx.fillStyle = toRgb(ink, pill.fill);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = toRgb(ink, 0.22);
    ctx.stroke();
    if (pill.icon) paintIcon(ctx, pill.icon, pill.x + 26, PAD + (PILL_H - 34) / 2, 34, toRgb(ink));
    pill.runs.forEach((r) => paintRun(ctx, r, ink));
  }
  // A soft local halo, as the hero's text-shadow; dark words need none.
  if (halo) {
    ctx.shadowColor = toRgb(HALO, 0.3);
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 3;
  }
  sky.runs.forEach((r) => paintRun(ctx, r, ink));
  ctx.restore();
}

// ── The sheet: sky, wind, sea and tide, then who made it ────────────

interface Cell {
  readonly icon: IconName | 'sky';
  readonly title: string;
  readonly sub: readonly string[];
}

interface PlacedCell {
  readonly cell: Cell;
  readonly x: number;
  readonly y: number;
  readonly title: readonly string[];
  readonly sub: readonly string[];
}

interface SheetLayout {
  readonly cells: readonly PlacedCell[];
  /** From the sheet's top. */
  readonly footerY: number;
  readonly height: number;
}

const COL_GAP = 44;
const COL_W = (W - PAD * 2 - COL_GAP) / 2;
const DISC = 76;
const TEXT_X = DISC + 24;
const TITLE = { size: 32, lead: 39 } as const;
const SUB = { size: 25, lead: 33 } as const;
const ROW_GAP = 40;
const SHEET_TOP_PAD = 68;
const FOOTER_H = 76;

function cardCells(card: WeatherCard, t: (m: Msg | MessageKey) => string): Cell[] {
  const cells: Cell[] = [
    {
      icon: 'sky',
      title: t(skyPhrase(card.sky, card.isDaylight)),
      sub: [
        t(msg('share.card.feels', { temp: card.feelsLike })),
        t(msg('share.card.range', { max: card.range.max, min: card.range.min })),
      ],
    },
    {
      icon: 'wind',
      // Without wind there is no direction worth naming.
      title: t(card.wind.level > 0 ? card.wind.labelFrom : card.wind.label),
      sub: [t(card.wind.detail)],
    },
  ];
  if (card.sea) {
    const waves = t(card.sea.waves);
    cells.push({
      icon: 'waves',
      title: t(card.sea.label),
      sub: [card.sea.water ? `${waves} · ${t(card.sea.water)}` : waves],
    });
  }
  if (card.tide) {
    const { reading, estimated } = card.tide;
    const next = msg('conditions.tide.next', { next: reading.nextLabel, until: reading.untilNext });
    cells.push({
      icon: reading.trend === 'subiendo' ? 'tide-up' : 'tide-down',
      title: t(reading.headline),
      sub: [t(estimated ? msg('share.card.tide.estimate', { next }) : next)],
    });
  }
  return cells;
}

function layoutSheet(ctx: Ctx, cells: readonly Cell[]): SheetLayout {
  const width = COL_W - TEXT_X;
  const placed: PlacedCell[] = [];
  let y = SHEET_TOP_PAD;
  for (let i = 0; i < cells.length; i += 2) {
    const row = cells.slice(i, i + 2).map((cell, column) => {
      setFont(ctx, 640, TITLE.size, -0.018);
      const title = wrap(ctx, cell.title, width, 2);
      setFont(ctx, 460, SUB.size);
      const sub = cell.sub.flatMap((text) => wrap(ctx, text, width, 2)).slice(0, 2);
      return { cell, x: PAD + column * (COL_W + COL_GAP), y, title, sub };
    });
    placed.push(...row);
    const tallest = Math.max(
      DISC,
      ...row.map((c) => c.title.length * TITLE.lead + 8 + c.sub.length * SUB.lead),
    );
    y += tallest + ROW_GAP;
  }
  const footerY = y - ROW_GAP + 52 + 2 + 40;
  return { cells: placed, footerY, height: footerY + FOOTER_H + 60 };
}

function paintSheet(
  ctx: Ctx,
  sheet: SheetLayout,
  top: number,
  p: Palette,
  card: WeatherCard,
  options: CardOptions,
  t: (m: Msg | MessageKey) => string,
): void {
  ctx.save();
  // The app's sheet, risen over the scene: rounded top, a soft shadow above.
  ctx.shadowColor = toRgb(oklch(0.2, 0.02, 250), 0.16);
  ctx.shadowBlur = 90;
  ctx.shadowOffsetY = -24;
  ctx.fillStyle = toRgb(p.surface);
  ctx.beginPath();
  ctx.roundRect(0, top, W, H - top + RADIUS, [RADIUS, RADIUS, 0, 0]);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  for (const placed of sheet.cells) {
    const x = placed.x;
    const y = top + placed.y;
    ctx.fillStyle = toRgb(p.accent, p.accentSoft);
    ctx.beginPath();
    ctx.arc(x + DISC / 2, y + DISC / 2, DISC / 2, 0, Math.PI * 2);
    ctx.fill();
    if (placed.cell.icon === 'sky') {
      paintGlyph(ctx, card, x + (DISC - 50) / 2, y + (DISC - 50) / 2, 50, p);
    } else {
      paintIcon(
        ctx,
        placed.cell.icon,
        x + (DISC - 38) / 2,
        y + (DISC - 38) / 2,
        38,
        toRgb(p.accent),
      );
    }

    let ty = y + 30;
    setFont(ctx, 640, TITLE.size, -0.018);
    ctx.fillStyle = toRgb(p.ink);
    for (const line of placed.title) {
      ctx.fillText(line, x + TEXT_X, ty);
      ty += TITLE.lead;
    }
    ty += 8 - TITLE.lead + SUB.lead;
    setFont(ctx, 460, SUB.size);
    ctx.fillStyle = toRgb(p.ink2);
    for (const line of placed.sub) {
      ctx.fillText(line, x + TEXT_X, ty);
      ty += SUB.lead;
    }
  }

  // A hairline, then the brand and where the data and the link come from.
  const footerY = top + sheet.footerY;
  ctx.fillStyle = toRgb(p.line, 0.09);
  ctx.fillRect(PAD, footerY - 40 - 2, W - PAD * 2, 2);

  paintBrandMark(ctx, PAD, footerY, FOOTER_H);
  const brandX = PAD + FOOTER_H + 22;
  setFont(ctx, 700, 36, -0.02);
  ctx.fillStyle = toRgb(p.ink);
  ctx.fillText(t('app.brand'), brandX, footerY + 33);
  setFont(ctx, 460, 24);
  ctx.fillStyle = toRgb(p.ink3);
  const tagline = t('share.card.tagline');
  ctx.fillText(tagline, brandX, footerY + 67);
  const leftW = brandX - PAD + Math.max(ctx.measureText(tagline).width, 240);

  const room = W - PAD * 2 - leftW - 40;
  const credit = t(options.demo ? 'credit.demo' : 'share.card.credit');
  const host = options.link ? hostOf(options.link) : null;
  ctx.textAlign = 'right';
  if (host) {
    setFont(ctx, 640, 28, -0.01);
    ctx.fillStyle = toRgb(p.accent);
    ctx.fillText(ellipsize(ctx, host, room), W - PAD, footerY + 33);
  }
  setFont(ctx, 460, 22);
  ctx.fillStyle = toRgb(p.ink3);
  ctx.fillText(ellipsize(ctx, credit, room), W - PAD, footerY + (host ? 67 : 48));
  ctx.restore();
}

function hostOf(link: string): string {
  try {
    const url = new URL(link);
    return (url.host + url.pathname).replace(/\/$/, '');
  } catch {
    return link;
  }
}

/** The brand's mark: the sun setting into the Atlantic, on its rounded tile. */
function paintBrandMark(ctx: Ctx, x: number, y: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 32, size / 32);
  ctx.beginPath();
  ctx.roundRect(0, 0, 32, 32, 10);
  ctx.clip();
  ctx.fillStyle = toRgb(BRAND_TILE);
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = toRgb(SUN);
  ctx.beginPath();
  ctx.arc(16, 16.5, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = toRgb(BRAND_SEA);
  ctx.fill(new Path2D(BRAND_WAVE));
  ctx.restore();
}

/** The two-tone sky glyph of the hourly forecast (see SkyGlyph), in the sheet's inks. */
function paintGlyph(ctx: Ctx, card: WeatherCard, x: number, y: number, size: number, p: Palette) {
  const tones: Readonly<Record<GlyphTone, { fill: string | null; stroke: string }>> = {
    sun: { fill: toRgb(SUN), stroke: toRgb(SUN_EDGE) },
    ray: { fill: null, stroke: toRgb(SUN_EDGE) },
    moon: { fill: toRgb(MOON), stroke: toRgb(mix(MOON, p.ink, 0.45)) },
    cloud: { fill: toRgb(p.cloudFill), stroke: toRgb(p.ink) },
    'cloud-back': { fill: toRgb(mix(p.cloudFill, p.ink, 0.16)), stroke: toRgb(p.ink, 0.7) },
    rain: { fill: null, stroke: toRgb(p.rain) },
    haze: { fill: null, stroke: toRgb(mix(HEAT, p.ink, 0.25)) },
  };
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const part of glyphParts(card.sky, card.isDaylight)) {
    const shift = /translate\(\s*([-\d.]+)[\s,]+([-\d.]+)\s*\)/.exec(part.transform ?? '');
    ctx.save();
    if (shift) ctx.translate(Number(shift[1]), Number(shift[2]));
    const path = new Path2D(part.d);
    const tone = tones[part.tone];
    if (tone.fill) {
      ctx.fillStyle = tone.fill;
      ctx.fill(path);
    }
    ctx.strokeStyle = tone.stroke;
    ctx.stroke(path);
    ctx.restore();
  }
  ctx.restore();
}
