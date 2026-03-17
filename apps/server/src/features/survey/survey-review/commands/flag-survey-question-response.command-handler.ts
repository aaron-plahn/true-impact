import { Inject } from '@nestjs/common';
import { FLAG_VALIDATION_SERVICE_INJECTION_TOKEN } from 'src/features/flags/constants';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from 'src/libs/data-types';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import { SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { FlagSurveyQuestionResponse } from './flag-survey-question-response.command';
import type { ISurveyReviewCommandRepository } from './survey-review-command-repository.interface';

interface IFlagValidationService {
  exists(id: string): Promise<boolean>;
}

export class FlagSurveyQuestionResponseCommandHandler implements ICommandHandler<FlagSurveyQuestionResponse> {
  constructor(
    @Inject(SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ISurveyReviewCommandRepository,
    @Inject(FLAG_VALIDATION_SERVICE_INJECTION_TOKEN)
    private readonly flagValidationService: IFlagValidationService,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      questionLabel,
      flagId,
    },
  }: {
    payload: FlagSurveyQuestionResponse;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(id)) ||
      new TrueImpactError(
        `You cannot flag question [${questionLabel}] in survey attempt [${id}] as there is no such attempt`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const doesFlagExist = await this.flagValidationService.exists(flagId);

    if (!doesFlagExist) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot flag the participant's response to question [${questionLabel}] in attempt [${id}] of survey [${existing.surveyName}], as there is no such flag [${flagId}].`,
        ),
      ]);
    }

    const updated = existing.flagResponseToQuestion({ questionLabel, flagId });

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
