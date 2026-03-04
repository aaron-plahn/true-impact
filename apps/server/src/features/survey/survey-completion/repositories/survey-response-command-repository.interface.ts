import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyResponseRecord } from '../models/survey-response-record.aggregate-root';

export const SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN =
  'SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN';

export interface ISurveyResponseCommandRepository {
  exists(id: string): Promise<boolean>;

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

  /**
   * There are specific rules around beginning a survey. Upholding these
   * requires a search of all attempts in progress within the database.
   * To emphasize this, we expose a `begin` method instead of a generic `create` method.
   */
  begin(
    emptyCompletionRecord: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;
}
