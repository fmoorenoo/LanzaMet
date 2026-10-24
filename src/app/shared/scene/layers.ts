import { CLOUDS } from './geometry';
import { SceneState } from './scene-state';
import { Afloat, SceneryArt } from './scenery';

/*
 * What each layer of the scene shows for a state, shared by the live scene
 * (scene.ts) and its still drawing for sharing (scene-paint.ts), so the
 * picture someone sends is the one they were looking at.
 */

/**
 * Boats always; windsurf sails only by day, more of them the harder it
 * blows; a breaker only when the sea is up, bigger the bigger it is.
 */
export function afloatFor(art: SceneryArt, state: SceneState): readonly Afloat[] {
  const { wind, daylight, seaLevel } = state;
  const sailing =
    daylight > 0.45 ? Math.round(Math.min(1, Math.max(0, (wind - 0.18) / 0.36)) * 3) : 0;
  let sails = 0;
  return art.afloat
    .filter((a) => {
      if (a.kind === 'sail') return sails++ < sailing;
      if (a.kind === 'breaker') return seaLevel >= 2;
      return true;
    })
    .map((a) =>
      a.kind === 'breaker' ? { ...a, scale: a.scale * (0.75 + 0.2 * (seaLevel - 2)) } : a,
    );
}

/** How many of the scene's clouds are out, from the cloud cover. */
export function visibleClouds(state: SceneState, mini: boolean): number {
  const cover = state.clouds;
  const count = cover < 0.06 ? 0 : Math.max(1, Math.round(cover * CLOUDS.length));
  return mini ? Math.min(count, 2) : count;
}

export function cloudOpacity(state: SceneState, index: number, visible: number): number {
  if (index >= visible) return 0;
  const base = CLOUDS[index].layer === 1 ? 0.7 : 0.95;
  return base * (0.55 + 0.45 * Math.min(1, state.clouds * 1.6));
}

/** The sea reflects whichever light is up: where (% across), how strongly, in what colour. */
export function glintFor(state: SceneState): { x: number; opacity: number; color: string } {
  const { sun, moon, clouds } = state;
  const useSun = sun.visible > 0;
  return {
    x: useSun ? sun.x : moon.x,
    opacity: (useSun ? sun.visible : moon.visible * 0.45) * (1 - clouds * 0.85),
    color: useSun ? sun.color : 'oklch(0.94 0.03 95)',
  };
}
