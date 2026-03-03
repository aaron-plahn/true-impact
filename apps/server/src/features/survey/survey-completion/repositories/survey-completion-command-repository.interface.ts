import { IBaseCommandRepository } from 'src/common/interfaces/persistence';
import { SurveyResponseRecord } from '../survey-response-record.aggregate-root';

export const SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN =
  'SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN';

// TODO move the query repo interface here?
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ISurveyCompletionCommandRepository extends IBaseCommandRepository<SurveyResponseRecord> {}
