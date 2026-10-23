import { FeedbackSubmission } from './feedback.model';

/**
 * Where feedback is delivered. The form and FeedbackService only know this
 * port; `provideFeedback()` binds it to a provider (Web3Forms today), so
 * changing provider means writing one class.
 *
 * `send` resolves only once the provider has confirmed receipt, and rejects
 * with a FeedbackError otherwise.
 */
export abstract class FeedbackTransport {
  /** False when this build has no credentials for the provider. */
  abstract readonly configured: boolean;

  abstract send(submission: FeedbackSubmission): Promise<void>;
}
