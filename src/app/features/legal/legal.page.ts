import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DATA_MODE } from '../../core/data/http/data-config';
import { msg, MessageKey } from '../../core/i18n/i18n.model';
import { TranslatePipe } from '../../core/i18n/t.pipe';
import { OfficialStore } from '../../core/state/official.store';
import { SectionStatus } from '../../core/state/section-state';
import { Icon } from '../../shared/ui/icon/icon';
import { FEEDBACK_PRIVACY_POINTS } from '../feedback/feedback-privacy';

const STATUS: Readonly<Record<Exclude<SectionStatus, 'empty'>, MessageKey>> = {
  ready: 'legal.status.ready',
  error: 'legal.status.error',
  loading: 'legal.status.checking',
};

const PRIVACY: readonly MessageKey[] = [
  'legal.privacy.summary',
  'legal.privacy.location',
  'legal.privacy.device',
  'legal.privacy.offline',
  'legal.privacy.erase',
  'legal.privacy.servers',
  'legal.privacy.share',
];

const TERMS: readonly MessageKey[] = [
  'legal.terms.free',
  'legal.terms.asIs',
  'legal.terms.responsibility',
  'legal.terms.thirdParty',
  'legal.terms.changes',
];

/** Everything legal in one place: privacy, terms of use, the data's sources and licences, and contact. */
@Component({
  selector: 'lm-legal-page',
  host: { id: 'legal-page', class: 'page legal-page' },
  imports: [RouterLink, Icon, TranslatePipe],
  templateUrl: './legal.page.html',
  styleUrl: './legal.page.scss',
})
export class LegalPage {
  private readonly official = inject(OfficialStore);

  protected readonly isDemo = inject(DATA_MODE) === 'demo';
  protected readonly privacy = PRIVACY;
  protected readonly feedbackPrivacy = FEEDBACK_PRIVACY_POINTS;
  protected readonly terms = TERMS;

  protected readonly warningsStatus = computed(() => {
    const status = this.official.bulletin().status;
    return msg(status === 'empty' ? 'legal.status.unavailable' : STATUS[status]);
  });

  protected readonly observationsStatus = computed(() => {
    const status = this.official.observations().status;
    return msg(status === 'empty' ? 'legal.status.noKey' : STATUS[status]);
  });
}
