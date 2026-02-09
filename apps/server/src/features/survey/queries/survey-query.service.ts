import { Inject, Injectable } from '../../../libs/framework';
import { SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN } from './survey-query-repository.interface';
import { SurveyViewModel } from './survey.view-model';

import type { ISurveyQueryRepository } from './survey-query-repository.interface';

@Injectable()
export class SurveyQueryService {
  constructor(
    @Inject(SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN)
    private readonly surveyQueryRepository: ISurveyQueryRepository,
  ) {}

  async fetchById(id: string): Promise<SurveyViewModel | null> {
    return this.surveyQueryRepository.fetchById(id);
  }
}
