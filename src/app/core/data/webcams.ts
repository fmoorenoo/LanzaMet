import { Lang } from '../i18n/i18n.model';
import { LocationId } from '../models';

/**
 * A public live camera that shows a place's coast, on someone else's
 * website. The app only links to it (never embeds it): what the visitor sees
 * is theirs, and so is whether it is on. Checked one by one on 2026-10-25:
 * each page served a live player (HLS, YouTube live or ipcamlive) that day.
 *
 * Only cameras that look at the sea and the shore belong here: the point is
 * to see the waves, the wind and the sky where the forecast says. A camera
 * on a lagoon, a marina or a resort pool is left out, even where it works.
 * Where the same view is streamed on YouTube, the YouTube link is the one
 * used: it plays anywhere, with no third-party page around it.
 */
export interface Webcam {
  /** The page with the player, per interface language where the site has one. */
  readonly url: Readonly<Record<Lang, string>>;
  /** What the camera looks at, as a name: "Playa Grande", "Charco de San Ginés". */
  readonly view: string;
  /** Who runs the page. */
  readonly provider: string;
}

const HARIA = 'Ayuntamiento de Haría';
const SKYLINE = 'SkylineWebcams';
const skyline = (page: string): Webcam['url'] => ({
  es: `https://www.skylinewebcams.com/es/webcam/espana/canarias/las-palmas/${page}.html`,
  en: `https://www.skylinewebcams.com/en/webcam/espana/canarias/las-palmas/${page}.html`,
});

const youtube = (id: string): Webcam['url'] => ({
  es: `https://www.youtube.com/watch?v=${id}`,
  en: `https://www.youtube.com/watch?v=${id}`,
});

const WEBCAMS: Readonly<Record<string, Webcam>> = {
  'puerto-del-carmen': {
    // Lanzarote Webcam's YouTube live stream of Playa Grande.
    url: youtube('YlRJXr4fCgM'),
    view: 'Playa Grande',
    provider: 'Lanzarote Webcam',
  },
  arrecife: {
    // The seafront by the Castillo de San Gabriel, with the open sea behind
    // it. (SkylineWebcams' other Arrecife camera, on the Charco de San Ginés
    // lagoon, is not the coast and is left out.)
    url: skyline('arrecife'),
    view: 'Castillo de San Gabriel',
    provider: SKYLINE,
  },
  'playa-blanca': {
    // The town's beach, with the Bocaina and Fuerteventura behind. (Marina
    // Rubicón's cameras show the marina, not the sea, and are left out.)
    url: skyline('yaiza-playa-blanca'),
    view: 'Playa Blanca',
    provider: SKYLINE,
  },
  'costa-teguise': {
    // The Beach Bar's YouTube live stream of Playa de las Cucharas.
    url: youtube('GE1WiiUlVvU'),
    view: 'Playa de las Cucharas',
    provider: 'Beach Bar Lanzarote',
  },
  famara: {
    url: {
      es: 'https://in2thebeach.es/webcam/42/playa-de-famara/',
      en: 'https://en.in2thebeach.es/webcam/42/playa-de-famara/',
    },
    view: 'Playa de Famara',
    provider: 'in2theBeach',
  },
  orzola: {
    url: {
      es: 'https://www.ayuntamientodeharia.com/haria/webcam-orzola-haria/',
      en: 'https://www.ayuntamientodeharia.com/haria/webcam-orzola-haria/',
    },
    view: 'Bahía de Órzola',
    provider: HARIA,
  },
  arrieta: {
    url: {
      es: 'https://www.ayuntamientodeharia.com/haria/web-cam-playa-de-la-garita-arrieta-haria/',
      en: 'https://www.ayuntamientodeharia.com/haria/web-cam-playa-de-la-garita-arrieta-haria/',
    },
    view: 'Playa de La Garita',
    provider: HARIA,
  },
  // La Santa: Club La Santa's camera shows the resort, not the sea.
  // El Golfo: no public camera was found (2026-10-25).
};

/** Places with a camera: Puerto del Carmen, Arrecife, Playa Blanca, Costa Teguise, Famara, Órzola, Arrieta. */

/** The live camera for a place, if one is known. */
export function webcamFor(id: LocationId): Webcam | null {
  return WEBCAMS[id] ?? null;
}

/** Every provider linked, once each, for the credits. */
export const WEBCAM_PROVIDERS: readonly string[] = [
  ...new Set(Object.values(WEBCAMS).map((w) => w.provider)),
];
