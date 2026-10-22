import { Location, StationObservation, WeatherWarning } from '../../core/models';
import { TIME } from '../../core/utils/time';
import { SimulationInput, simulateWeather } from './simulator';

/*
 * DEMO DATA — official-looking information for the simulator, so the warning
 * banner and the measured-reading line can be seen. Never shown outside the
 * demo build.
 */

export function simulateWarnings(input: Omit<SimulationInput, 'location'>): WeatherWarning[] {
  const dayStart = new Date(Math.floor(input.now.getTime() / TIME.HOUR) * TIME.HOUR);
  const until = new Date(dayStart.getTime() + 18 * TIME.HOUR).toISOString();
  const coastal: WeatherWarning = {
    id: 'demo-costeros',
    level: 'amarillo',
    phenomenon: 'Costeros',
    coastal: true,
    area: 'Costa - Lanzarote',
    onset: dayStart.toISOString(),
    expires: until,
    description: 'Mar combinada del norte de 3 a 4 metros (simulado).',
    url: 'https://www.aemet.es/es/eltiempo/prediccion/avisos',
  };
  switch (input.scenario) {
    case 'borrasca':
      return [
        coastal,
        {
          ...coastal,
          id: 'demo-lluvias',
          phenomenon: 'Lluvias',
          coastal: false,
          area: 'Lanzarote',
          description: 'Precipitación acumulada en una hora: 15 mm (simulado).',
        },
      ];
    case 'ventoso':
      return [coastal];
    default:
      return [];
  }
}

export function simulateObservation(input: SimulationInput): StationObservation {
  const location: Location = input.location;
  const hour = new Date(Math.floor(input.now.getTime() / TIME.HOUR) * TIME.HOUR);
  const now = simulateWeather({ ...input, now: hour }).current;
  return {
    stationId: 'DEMO',
    stationName: 'Estación de demostración',
    position: location.position,
    altitudeM: 10,
    time: hour.toISOString(),
    temperatureC: now.temperatureC,
    windKmh: now.wind.speedKmh,
    gustKmh: now.wind.gustKmh,
    windFromDegrees: now.wind.fromDegrees,
    humidity: 70,
    precipitationMm: 0,
  };
}
