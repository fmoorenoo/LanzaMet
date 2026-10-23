export type LocationId = string;

/** Compass points in Spanish notation (O = oeste). */
export type CardinalDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SO' | 'O' | 'NO';

export type IslandArea = 'norte' | 'este' | 'sur' | 'oeste';

export type PlaceKind = 'ciudad' | 'pueblo' | 'playa' | 'costa';

/** What the place looks like from its shore; drives the scene's horizon. */
export type HorizonProfile =
  'abierto' | 'risco' | 'bahia' | 'graciosa' | 'fuerteventura' | 'bocaina' | 'volcanes';

/**
 * The place's own landmarks, drawn in front of its horizon: what someone who
 * knows the place would recognise first (see shared/scene/scenery.ts).
 */
export type SceneryId =
  | 'reducto'
  | 'playa-grande'
  | 'pechiguera'
  | 'las-cucharas'
  | 'famara'
  | 'la-santa'
  | 'orzola'
  | 'el-golfo';

export type ShoreKind = 'arena-dorada' | 'arena-negra' | 'roca';

export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Where a place's tide comes from. A tide gauge or an official reference port
 * gives predictions that can be shown as such; a numerical model only gives
 * an estimate, and the interface has to say so.
 */
export type TideCoverage =
  | { readonly kind: 'station'; readonly stationName: string }
  | { readonly kind: 'reference'; readonly stationName: string }
  | { readonly kind: 'model' }
  | { readonly kind: 'none' };

export interface DataCoverage {
  /**
   * Open-water point the marine forecast is read at, or null when there is
   * none. Marine models mask the cells that touch the coast, so this is the
   * nearest sea cell on the side the place faces, not the place itself.
   */
  readonly sea: GeoPoint | null;
  readonly tide: TideCoverage;
}

export interface Location {
  readonly id: LocationId;
  readonly name: string;
  readonly municipality: string;
  readonly area: IslandArea;
  readonly kind: PlaceKind;
  readonly position: GeoPoint;
  /** Direction the coast faces — what the wind and the sunset hit. */
  readonly facing: CardinalDirection;
  readonly horizon: HorizonProfile;
  readonly shore: ShoreKind;
  readonly scenery: SceneryId;
  readonly coverage: DataCoverage;
}
