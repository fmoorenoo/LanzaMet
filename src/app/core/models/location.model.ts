export type LocationId = string;

/** Compass points in Spanish notation (O = oeste). */
export type CardinalDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SO' | 'O' | 'NO';

export type IslandArea = 'norte' | 'este' | 'sur' | 'oeste';

export type PlaceKind = 'ciudad' | 'pueblo' | 'playa' | 'costa';

/** What the place looks like from its shore; drives the scene's horizon. */
export type HorizonProfile = 'abierto' | 'risco' | 'graciosa' | 'fuerteventura' | 'volcanes';

export type ShoreKind = 'arena-dorada' | 'arena-negra' | 'roca';

export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Not every place will have a tide gauge or marine model behind it once real
 * providers are wired in. Coverage is explicit so the UI can say so honestly.
 */
export type TideCoverage =
  | { readonly kind: 'station'; readonly stationName: string }
  | { readonly kind: 'reference'; readonly stationName: string }
  | { readonly kind: 'none' };

export interface DataCoverage {
  readonly sea: boolean;
  readonly tide: TideCoverage;
}

export interface Location {
  readonly id: LocationId;
  readonly name: string;
  readonly municipality: string;
  readonly area: IslandArea;
  readonly kind: PlaceKind;
  /** One plain sentence about the place, written for visitors. */
  readonly summary: string;
  readonly position: GeoPoint;
  /** Direction the coast faces — what the wind and the sunset hit. */
  readonly facing: CardinalDirection;
  readonly horizon: HorizonProfile;
  readonly shore: ShoreKind;
  readonly coverage: DataCoverage;
}
