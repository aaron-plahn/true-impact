import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyResponseRecordViewModel } from './survey-response-record.view-model';

export const SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN =
  'SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN';

export interface ISurveyResponseQueryRepository {
  fetchById(id: string): Promise<SurveyResponseRecordViewModel> | null; // Maybe<T>

  fetchMany(): Promise<SurveyResponseRecordViewModel[]>;

  // Error || Ack
  create(
    instance: SurveyResponseRecordViewModel,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;

  // Error[] ?
  createMany(instances: SurveyResponseRecordViewModel[]): Promise<void>;
}
