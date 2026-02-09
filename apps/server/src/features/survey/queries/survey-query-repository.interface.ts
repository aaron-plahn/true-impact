import { IBaseQueryRepository } from 'src/common/interfaces/persistence/base-query-repository.interface';
import { SurveyViewModel } from './survey.view-model';

export const SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN =
  'SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ISurveyQueryRepository extends IBaseQueryRepository<SurveyViewModel> {}
