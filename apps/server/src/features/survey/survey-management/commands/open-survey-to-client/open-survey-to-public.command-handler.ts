import { Inject } from '@nestjs/common';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../../../../features/survey/constants';
import type { ISurveyCommandRepository } from '../../../../../features/survey/repositories';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../../libs/data-types';
import { OpenSurveyToPublic } from './open-survey-to-public.command';

export class OpenSurveyToPublicCommandHandler implements ICommandHandler<OpenSurveyToPublic> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyCommandRepository: ISurveyCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
    },
  }: {
    payload: OpenSurveyToPublic;
  }): Promise<CommandResult> {
    const target = await this.surveyCommandRepository.fetchById(id);

    if (!target) {
      return new TrueImpactError(
        `Failed to update survey [${id}] as there is no such survey`,
      );
    }

    const updateResult = target?.openToPublic();

    if (updateResult instanceof TrueImpactError) {
      return updateResult;
    }

    const result = await this.surveyCommandRepository.update(updateResult);

    return result;
  }
}
