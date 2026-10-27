import { LocationId } from '../models';

/**
 * What tells each place apart, beyond `locations.ts`, for the "About" block
 * at the end of its pages. Facts from the README ("Puntos de consulta por
 * zona", "AEMET: qué funciona y qué falta"); keep them in step.
 */
export interface ZoneGuide {
  /** The AEMET station whose readings stand for the place ("Medido"), if any is low and close. */
  readonly station: string | null;
  /** The place the weather model can't tell this one from (same cell), if any. */
  readonly sharesWeatherWith: LocationId | null;
  /** The nearest places along the coast, linked from its pages. */
  readonly nearby: readonly LocationId[];
}

export const ZONE_GUIDE: Readonly<Record<LocationId, ZoneGuide>> = {
  'puerto-del-carmen': {
    station: 'Aeropuerto de Lanzarote',
    sharesWeatherWith: null,
    nearby: ['arrecife', 'playa-blanca'],
  },
  arrecife: {
    station: 'Arrecife-Granja Cabildo',
    sharesWeatherWith: 'costa-teguise',
    nearby: ['costa-teguise', 'puerto-del-carmen'],
  },
  'playa-blanca': {
    station: 'Yaiza-Playa Blanca',
    sharesWeatherWith: null,
    nearby: ['el-golfo', 'puerto-del-carmen'],
  },
  'costa-teguise': {
    station: 'Arrecife-Granja Cabildo',
    sharesWeatherWith: 'arrecife',
    nearby: ['arrecife', 'arrieta'],
  },
  famara: { station: null, sharesWeatherWith: 'la-santa', nearby: ['la-santa', 'orzola'] },
  'la-santa': { station: null, sharesWeatherWith: 'famara', nearby: ['famara', 'el-golfo'] },
  orzola: { station: 'La Graciosa', sharesWeatherWith: null, nearby: ['arrieta', 'famara'] },
  arrieta: { station: null, sharesWeatherWith: null, nearby: ['orzola', 'costa-teguise'] },
  'el-golfo': { station: null, sharesWeatherWith: null, nearby: ['playa-blanca', 'la-santa'] },
};
