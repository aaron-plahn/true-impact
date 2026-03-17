import { TrueImpactError } from '../../../../libs/data-types';
import { Inject } from '../../../../libs/framework';
import type { ISurveyReviewCommandRepository } from '../commands';
import { SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { SurveyReview } from '../survey-review.aggregate-root';
import {
  SurveyReviewViewModel,
  SurveyReviewViewModelClientDto,
} from './survey-review.view-model';

export class SurveyReviewQueryService {
  constructor(
    @Inject(SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyReviewCommandRepository: ISurveyReviewCommandRepository,
  ) {}

  async fetchById(id: string) {
    const domainModelSearchResult =
      await this.surveyReviewCommandRepository.fetchById(id);

    if (!domainModelSearchResult) {
      return null;
    }

    return this.buildViewModel(domainModelSearchResult);
  }

  async fetchMany() {
    const domainModels = await this.surveyReviewCommandRepository.fetchMany();

    if (domainModels instanceof TrueImpactError) {
      return domainModels;
    }

    const result = domainModels.map((dm) => this.buildViewModel(dm));

    return result;
  }

  private buildViewModel(
    domainModel: SurveyReview,
  ): SurveyReviewViewModelClientDto {
    return SurveyReviewViewModel.fromDomainModel(domainModel).toClientDto();
  }
}
