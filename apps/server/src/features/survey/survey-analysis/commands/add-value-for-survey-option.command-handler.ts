import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories';
import { AddValueForSurveyOption } from './add-value-for-survey-option.command';

export class AddValueForSurveyOptionCommandHandler implements ICommandHandler<AddValueForSurveyOption> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly repository: ISurveyCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      analyzerName,
      questionLabel,
      optionLabel,
      valuesByCategory,
    },
  }: {
    payload: AddValueForSurveyOption;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(id)) ||
      new TrueImpactError(
        `Failed to add value for analyzer [${analyzerName}] in survey [${id}], as there is no such survey.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const updated = existing.addValueForOption({
      analyzerName,
      questionLabel,
      optionLabel,
      valuesByCategory,
    });

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
