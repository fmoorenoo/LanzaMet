import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { FeedbackTransport } from './feedback-transport';
import { Web3FormsTransport } from './web3forms.transport';

/** Delivers feedback through Web3Forms. Another provider only needs another FeedbackTransport. */
export function provideFeedback(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: FeedbackTransport, useClass: Web3FormsTransport }]);
}
