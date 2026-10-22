import type { Msg } from '../i18n/i18n.model';
import { LocationId } from './location.model';
import { IsoInstant } from './weather.model';

export type PlanKind = 'playa' | 'resguardo' | 'mar-calmo' | 'paseo' | 'atardecer' | 'olas';

export interface TimeWindow {
  readonly from: IsoInstant;
  readonly to: IsoInstant;
}

export interface Recommendation {
  readonly id: string;
  readonly kind: PlanKind;
  readonly locationId: LocationId;
  /** Short, plain-language headline: "Playa en Playa Blanca". */
  readonly title: Msg;
  /** Why, in one sentence. */
  readonly reason: Msg;
  readonly window?: TimeWindow;
  /** 0–1, used for ordering only. */
  readonly score: number;
}
