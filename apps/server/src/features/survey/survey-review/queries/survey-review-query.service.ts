import {
  FlagQueryService,
  FlagViewModelClientDto,
} from '../../../../features/flags/queries';
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
    private readonly flagQueryService: FlagQueryService,
  ) {}

  async fetchById(id: string) {
    const domainModelSearchResult =
      await this.surveyReviewCommandRepository.fetchById(id);

    if (!domainModelSearchResult) {
      return null;
    }

    const flags = await this.flagQueryService.fetchMany();

    if (flags instanceof TrueImpactError) {
      return flags;
    }

    const flagsById = new Map<string, FlagViewModelClientDto>();

    flags.forEach((flag) => {
      flagsById.set(flag.id, flag);
    });

    return this.buildViewModel(domainModelSearchResult, { flags: flagsById });
  }

  async fetchMany() {
    const domainModels = await this.surveyReviewCommandRepository.fetchMany();

    if (domainModels instanceof TrueImpactError) {
      return domainModels;
    }

    const flags = await this.flagQueryService.fetchMany();

    if (flags instanceof TrueImpactError) {
      return flags;
    }

    const flagsById = new Map<string, FlagViewModelClientDto>();

    flags.forEach((flag) => {
      flagsById.set(flag.id, flag);
    });

    const result = domainModels.map((dm) =>
      this.buildViewModel(dm, { flags: flagsById }),
    );

    return result;
  }

  private buildViewModel(
    domainModel: SurveyReview,
    context: { flags: Map<string, FlagViewModelClientDto> },
  ): SurveyReviewViewModelClientDto {
    const result = SurveyReviewViewModel.fromDomainModel(
      domainModel,
      context,
    ).toClientDto();

    return result;
  }
}
