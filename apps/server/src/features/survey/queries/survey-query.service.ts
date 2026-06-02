import { Inject, Injectable } from '../../../libs/framework';
import { SurveyViewModel, SurveyViewModelClientDto } from './survey.view-model';

import {
  FlagQueryService,
  FlagViewModelClientDto,
} from '../../../features/flags/queries';
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
    private readonly flagQueryService: FlagQueryService,
  ) {}

  async fetchById(
    id: string,
  ): Promise<SurveyViewModelClientDto | TrueImpactError | null> {
    const searchResult =
      (await this.surveyCommandRepository.fetchById(id)) ||
      // Does this lead to a 404?
      new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to fetch survey [${id}], as there is no survey with this ID.`,
        ),
      ]);

    if (searchResult instanceof TrueImpactError) {
      return searchResult;
    }

    /**
     * TODO We could fetch only the relevant flags for this survey's options.
     * But we will move to a dedicated query database with materialized views
     * as soon as we hit performance issues with the current approach.
     */
    const flags = await this.flagQueryService.fetchMany();

    if (flags instanceof TrueImpactError) {
      return new TrueImpactError(
        `Failed to fetch flags for survey [${searchResult.name}].`,
        [flags],
      );
    }

    return this.buildViewModel(searchResult, {
      flags: new Map(flags.map((f) => [f.id, f])),
    });
  }

  async fetchMany(): Promise<SurveyViewModelClientDto[] | TrueImpactError> {
    const domainModels = await this.surveyCommandRepository.fetchMany();

    /**
     * TODO Ideally we will filter in the database. But once we get enough data that
     * this is not performant, we will move to eagerly building a separate query database
     * synchronized by events.
     */
    const flags = await this.flagQueryService.fetchMany();

    if (flags instanceof TrueImpactError) {
      return new TrueImpactError(
        `Failed to fetch surveys due to failure to fetch flags.`,
        [flags],
      );
    }

    const context = {
      flags: new Map(flags.map((f) => [f.id, f])),
    };

    return domainModels.map((dm) => this.buildViewModel(dm, context));
  }

  async fetchAvailable(): Promise<
    SurveyViewModelClientDto[] | TrueImpactError
  > {
    const all = await this.fetchMany();

    if (all instanceof Error) {
      return all;
    }

    /**
     * TODO
     * 1. filter in the DB
     * 2. make this depend upon a participant context
     */
    return all.filter((survey) => survey.isPublished);
  }

  private buildViewModel(
    domainModel: Survey,
    context: { flags: Map<string, FlagViewModelClientDto> },
  ): SurveyViewModelClientDto {
    const view = SurveyViewModel.fromDomainModel(domainModel, context);

    return view.toClientDto();
  }
}
