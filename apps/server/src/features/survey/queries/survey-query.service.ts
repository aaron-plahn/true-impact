import { Inject, Injectable } from '../../../libs/framework';
import { SurveyViewModel } from './survey.view-model';

import { TrueImpactError } from 'src/libs';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
import type { ISurveyQueryRepository } from './survey-query-repository.interface';

@Injectable()
export class SurveyQueryService {
  constructor(
    /**
     * For now, we do not have a separate query DB. Instead, we project off
     * the domain. We are satisfying the query repo API with the command
     * repo. This gives atomic consistency (instead of eventual consistency),
     * but will have performance issues as the number of aggregate root documents \ events in
     * their event history grows.
     */
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyQueryRepository: ISurveyQueryRepository,
  ) {}

  async fetchById(id: string): Promise<SurveyViewModel | null> {
    return this.surveyQueryRepository.fetchById(id);
  }

  async fetchMany(): Promise<SurveyViewModel[] | TrueImpactError> {
    return this.surveyQueryRepository.fetchMany();
  }
}
