import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyResponseRecord } from '../models/survey-response-record.aggregate-root';

export const SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN =
  'SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN';

export interface ISurveyResponseCommandRepository {
  fetchById(id: string): Promise<SurveyResponseRecord | null>; // Maybe<SurveyResponseRecord>

  fetchMany(): Promise<SurveyResponseRecord[]>;

  // Error || Ack
  create(
    instance: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;

  // Error[] ?
  createMany(instances: SurveyResponseRecord[]): Promise<void>;

  update(
    instance: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;
}
