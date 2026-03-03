import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import { SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../repositories';

import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import type { ISurveyCompletionCommandRepository } from '../repositories';
import { AnswerSurveyQuestion } from './answer-survey-question.command';

export class AnswerSurveyQuestionCommandHandler implements ICommandHandler<AnswerSurveyQuestion> {
  constructor(
    @Inject(SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ISurveyCompletionCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      questionLabel,
      chosenOptionLabel,
    },
  }: {
    payload: AnswerSurveyQuestion;
  }): Promise<CommandResult> {
    const targetCompletionAttempt = await this.repository.fetchById(id);

    if (!targetCompletionAttempt) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to answer question in survey attempt [${id}], as there is no such attempt in progress.`,
        ),
      ]);
    }

    const updatedInstance = targetCompletionAttempt.answerQuestion(
      questionLabel,
      chosenOptionLabel,
    );

    if (updatedInstance instanceof TrueImpactError) {
      return updatedInstance;
    }

    const persistenceResult = await this.repository.update(updatedInstance);

    return persistenceResult;
  }
}
