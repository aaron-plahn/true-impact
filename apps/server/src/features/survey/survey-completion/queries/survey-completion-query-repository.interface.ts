import { IBaseQueryRepository } from 'src/common/interfaces/persistence/base-query-repository.interface';
import { SurveyCompletionRecordViewModel } from './survey-completion-record.view-model';

export const SURVEY_COMPLETION_QUERY_REPOSITORY_INJECTION_TOKEN =
  'SURVEY_COMPLETION_QUERY_REPOSITORY_INJECTION_TOKEN';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ISurveyCompletionQueryRepository extends IBaseQueryRepository<SurveyCompletionRecordViewModel> {}
