import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { FLAG_VALIDATION_SERVICE_INJECTION_TOKEN } from '../../../flags/constants';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories';
import { FlagSurveyOption } from './flag-survey-option.command';

interface IFlagValidationService {
  exists(flagId: string): Promise<boolean>;
}

export class FlagSurveyOptionCommandHandler implements ICommandHandler<FlagSurveyOption> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyRepository: ISurveyCommandRepository,
    @Inject(FLAG_VALIDATION_SERVICE_INJECTION_TOKEN)
    private readonly flagValidationService: IFlagValidationService,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id: surveyId },
      questionLabel,
      optionLabel,
      flagId,
    },
  }: {
    payload: FlagSurveyOption;
  }): Promise<CommandResult> {
    const existing =
      (await this.surveyRepository.fetchById(surveyId)) ||
      new TrueImpactError(
        `Failed to add flag to survey [${surveyId}], as there is no such survey.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const doesFlagExist = await this.flagValidationService.exists(flagId);

    if (!doesFlagExist) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to add flag [${flagId}] to survey [${existing.name}], as there is no such flag`,
        ),
      ]);
    }

    const updated = existing.flagOption({
      questionLabel,
      optionLabel,
      flagId,
    });

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.surveyRepository.update(updated);

    return persistenceResult;
  }
}
