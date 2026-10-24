import { IconName, ICONS, IconShape } from './icons';

const num = (value: unknown) => Number(value ?? 0);

/** One shape of the 24px grid as a canvas path. */
function shapePath([tag, a]: IconShape): Path2D {
  const path = new Path2D();
  switch (tag) {
    case 'path':
      path.addPath(new Path2D(String(a['d'])));
      break;
    case 'circle':
      path.arc(num(a['cx']), num(a['cy']), num(a['r']), 0, Math.PI * 2);
      break;
    case 'ellipse':
      path.ellipse(num(a['cx']), num(a['cy']), num(a['rx']), num(a['ry']), 0, 0, Math.PI * 2);
      break;
    case 'line':
      path.moveTo(num(a['x1']), num(a['y1']));
      path.lineTo(num(a['x2']), num(a['y2']));
      break;
    case 'rect':
      path.roundRect(
        num(a['x']),
        num(a['y']),
        num(a['width']),
        num(a['height']),
        num(a['rx'] ?? a['ry']),
      );
      break;
    case 'polyline':
    case 'polygon': {
      const points = String(a['points'])
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      for (let i = 0; i + 1 < points.length; i += 2) {
        if (i === 0) path.moveTo(points[i], points[i + 1]);
        else path.lineTo(points[i], points[i + 1]);
      }
      if (tag === 'polygon') path.closePath();
      break;
    }
  }
  return path;
}

/**
 * An icon of the app's set drawn on a canvas, with the same 24px grid,
 * 1.75 stroke and round caps as the `Icon` component. `x`, `y` are its top
 * left corner and `size` its side, in canvas pixels.
 */
export function paintIcon(
  ctx: CanvasRenderingContext2D,
  name: IconName,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  const definition = ICONS[name];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.lineWidth = 1.75;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  for (const shape of definition.shapes) {
    const path = shapePath(shape);
    if ('filled' in definition) ctx.fill(path);
    ctx.stroke(path);
  }
  ctx.restore();
}
