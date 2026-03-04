import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyCompletionRecordViewModel } from './survey-completion-record.view-model';

export const SURVEY_COMPLETION_QUERY_REPOSITORY_INJECTION_TOKEN =
  'SURVEY_COMPLETION_QUERY_REPOSITORY_INJECTION_TOKEN';

export interface ISurveyCompletionQueryRepository {
  fetchById(id: string): Promise<SurveyCompletionRecordViewModel> | null; // Maybe<T>

  fetchMany(): Promise<SurveyCompletionRecordViewModel[]>;

  // Error || Ack
  create(
    instance: SurveyCompletionRecordViewModel,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;

  // Error[] ?
  createMany(instances: SurveyCompletionRecordViewModel[]): Promise<void>;
}
