import { EventSourcedCommandRepository } from '../../../../libs/cqrs-es';
import { SurveyResponseRecord } from '../models/survey-response-record.aggregate-root';

export const SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN =
  'SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN';

/**
 * We really don't need this interface because the `EventSourcedCommandRepository`
 * gives us a free implementation if we provide the simpler `EventRepository`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ISurveyResponseCommandRepository extends EventSourcedCommandRepository<SurveyResponseRecord> {}
