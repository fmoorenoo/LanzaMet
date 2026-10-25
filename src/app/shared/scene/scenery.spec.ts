import { LOCATIONS } from '../../core/data/locations';
import { HORIZON_VIEWBOX } from './geometry';
import { sceneryArt } from './scenery';

/** Every point a path visits, control points included (the commands scenery.ts writes). */
function points(d: string): { x: number; y: number }[] {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  const out: { x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  let i = 0;
  const next = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const command = tokens[i++];
    if (command === 'M' || command === 'L') {
      x = next();
      y = next();
    } else if (command === 'Q') {
      out.push({ x: next(), y: next() });
      x = next();
      y = next();
    } else if (command === 'H') x = next();
    else if (command === 'V') y = next();
    else if (command === 'h') x += next();
    else if (command === 'v') y += next();
    else if (command === 'Z') continue;
    else throw new Error(`Unexpected command ${command}`);
    out.push({ x, y });
  }
  return out;
}

describe('scenery', () => {
  it('gives every place its own landmarks', () => {
    const sceneries = LOCATIONS.map((l) => l.scenery);
    expect(new Set(sceneries).size).toBe(LOCATIONS.length);
    const drawings = sceneries.map((id) => JSON.stringify(sceneryArt(id)));
    expect(new Set(drawings).size).toBe(LOCATIONS.length);
  });

  it('draws what each place is known for', () => {
    expect(sceneryArt('reducto').glass).not.toBe('');
    expect(sceneryArt('pechiguera').lamps).toHaveLength(1);
    expect(sceneryArt('orzola').breakwater).not.toBe('');
    expect(sceneryArt('orzola').afloat.some((a) => a.kind === 'ferry')).toBe(true);
    expect(sceneryArt('las-cucharas').afloat.filter((a) => a.kind === 'sail')).toHaveLength(3);
    expect(sceneryArt('el-golfo').strata.length).toBeGreaterThan(3);
    expect(sceneryArt('el-golfo').lagoon).not.toBe('');
    expect(sceneryArt('playa-grande').fronds).not.toBe('');
    // Arrieta: La Garita's sand, the blue Casa Juanita, the pier with its light and boats.
    const garita = sceneryArt('garita');
    expect(garita.beach).not.toBe('');
    expect(garita.accent).not.toBe('');
    expect(garita.breakwater).not.toBe('');
    expect(garita.lamps).toHaveLength(1);
    expect(garita.afloat.filter((a) => a.kind === 'boat').length).toBeGreaterThan(1);
  });

  it('keeps tall landmarks right of the words, and everything on the land or the sea', () => {
    const { width, height } = HORIZON_VIEWBOX;
    for (const { scenery } of LOCATIONS) {
      const art = sceneryArt(scenery);
      const built = [art.walls, art.shade, art.glass, art.windows, art.accent].flatMap(points);
      for (const p of built) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(width);
        // Taller than 45 units only at the right-hand edge (see scenery.ts).
        if (p.y < height - 45) expect(p.x).toBeGreaterThan(1000);
      }
      // Afloat things ride on the sea, below the waterline.
      for (const item of art.afloat) expect(item.y).toBeGreaterThan(height);
    }
  });

  it('computes each scenery once', () => {
    expect(sceneryArt('famara')).toBe(sceneryArt('famara'));
  });
});
