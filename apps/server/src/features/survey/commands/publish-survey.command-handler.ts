import { Inject } from '../../../libs/framework';

import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import { TrueImpactError } from 'src/libs/data-types';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
import type { ISurveyCommandRepository } from '../repositories';
import { PublishSurvey } from './publish-survey.command';

export class PublishSurveyCommandHandler implements ICommandHandler {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyRepository: ISurveyCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
    },
  }: {
    payload: PublishSurvey;
  }): Promise<CommandResult> {
    const existingInstance = await this.surveyRepository.fetchById(id);

    const updatedInstance =
      existingInstance?.publish() ||
      new TrueImpactError(
        `Failed to publish survey [${id}] as there is no such survey.`,
      );

    // TODO wrap this somewhere else
    if (updatedInstance instanceof TrueImpactError) {
      return updatedInstance;
    }

    const result = await this.surveyRepository.update(updatedInstance);

    return result;
  }
}
