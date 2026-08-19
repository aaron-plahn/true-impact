import { Inject } from '../../../../libs/framework';

import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories';
import { FinalizeSurvey } from './finalize-survey.command';

export class FinalizeSurveyCommandHandler implements ICommandHandler {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyRepository: ISurveyCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
    },
  }: {
    payload: FinalizeSurvey;
  }): Promise<CommandResult> {
    const existingInstance = await this.surveyRepository.fetchById(id);

    const updatedInstance =
      existingInstance?.finalize() ||
      new TrueImpactError(
        `Failed to finalize survey [${id}] as there is no such survey.`,
      );

    // TODO wrap this somewhere else
    if (updatedInstance instanceof TrueImpactError) {
      return updatedInstance;
    }

    const result = await this.surveyRepository.update(updatedInstance);

    return result;
  }
}
