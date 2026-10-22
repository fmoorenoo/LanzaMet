import { Location } from './location.model';
import { SeaForecast } from './marine.model';
import { WeatherForecast } from './weather.model';

/** Everything known about one place, used by island-wide views. */
export interface ZoneConditions {
  readonly location: Location;
  readonly weather: WeatherForecast;
  readonly sea: SeaForecast | null;
}
