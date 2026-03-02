import { Inject, Injectable } from '../../../libs/framework';
import { SurveyViewModel, SurveyViewModelClientDto } from './survey.view-model';

import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
import type { ISurveyCommandRepository } from '../repositories';
import { Survey } from '../survey-management/survey.aggregate-root';

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
    private readonly surveyCommandRepository: ISurveyCommandRepository,
  ) {}

  async fetchById(
    id: string,
  ): Promise<SurveyViewModelClientDto | TrueImpactError> {
    const searchResult =
      (await this.surveyCommandRepository.fetchById(id)) ||
      new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to fetch survey [${id}], as there is no survey with this ID.`,
        ),
      ]);

    if (searchResult instanceof TrueImpactError) {
      return searchResult;
    }

    return this.buildViewModel(searchResult);
  }

  async fetchMany(): Promise<SurveyViewModelClientDto[] | TrueImpactError> {
    const domainModels = await this.surveyCommandRepository.fetchMany();

    return domainModels.map((dm) => this.buildViewModel(dm));
  }

  private buildViewModel(domainModel: Survey): SurveyViewModelClientDto {
    const view = SurveyViewModel.fromDomainModel(domainModel);

    return view.toClientDto();
  }
}
