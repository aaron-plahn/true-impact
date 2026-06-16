import { randomUUID } from 'node:crypto';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { Inject } from '../../../../libs/framework';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories';
import { Survey } from '../survey.aggregate-root';
import { CreateSurvey } from './create-survey.command';

// @CommandHandler
export class CreateSurveyCommandHandler implements ICommandHandler {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly repository: ISurveyCommandRepository,
    // ID Generator
  ) {}

  async handle({
    payload: { name },
  }: {
    payload: CreateSurvey;
  }): Promise<CommandResult> {
    const buildResult = Survey.buildEmpty({ name, id: randomUUID() });

    if (buildResult instanceof TrueImpactError) {
      return buildResult;
    }

    const result = await this.repository.create(buildResult);

    return result;
  }
}
