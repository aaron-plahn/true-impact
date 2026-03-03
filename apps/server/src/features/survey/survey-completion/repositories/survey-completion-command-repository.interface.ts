import {
  IBaseCommandRepository,
  PersistenceAcknowledgement,
} from 'src/common/interfaces/persistence';
import { TrueImpactError } from 'src/libs/data-types';
import { SurveyResponseRecord } from '../survey-response-record.aggregate-root';

export const SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN =
  'SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN';

// TODO move the query repo interface to this same dir?
export interface ISurveyCompletionCommandRepository extends IBaseCommandRepository<SurveyResponseRecord> {
  /**
   * There are specific rules around beginning a survey.
   */
  begin(
    emptyCompletionRecord: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;
}
