import { TrueImpactError } from '../../../libs/data-types';
import { SurveyViewModel } from './survey.view-model';

export const SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN =
  'SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN';

export interface ISurveyQueryRepository {
  fetchById(id: string): Promise<SurveyViewModel> | null; // Maybe<T>

  fetchMany(): Promise<SurveyViewModel[]>;

  // Error || Ack
  create(instance: SurveyViewModel): Promise<string | TrueImpactError>;

  // Error[] ?
  createMany(instances: SurveyViewModel[]): Promise<void>;
}
