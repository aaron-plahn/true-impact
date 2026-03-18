import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { AddNoteAboutQuestionResponse } from './add-note-about-question-response.command';
import type { ISurveyReviewCommandRepository } from './survey-review-command-repository.interface';

interface ILanguageValidationService {
  has(languageCode: string): boolean;
}

export class AddNoteAboutQuestionResponseCommandHandler implements ICommandHandler<AddNoteAboutQuestionResponse> {
  private readonly langaugeValidationService: ILanguageValidationService = {
    has(languageCode: string): boolean {
      return ['en', 'clc'].includes(languageCode);
    },
  };

  constructor(
    @Inject(SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ISurveyReviewCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      questionLabel,
      note,
      languageCode,
    },
  }: {
    payload: AddNoteAboutQuestionResponse;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(id)) ||
      new TrueImpactError(
        `You cannot add a note about the participant's response to question [${questionLabel}] in survey attempt [${id}], as there is no such attempt.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    if (!this.langaugeValidationService.has(languageCode)) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot add a note about the participant's response to question [${questionLabel}] in attempt [${id}] of survey [${existing.surveyName}], as the provided language code [${languageCode}] is not supported.`,
        ),
      ]);
    }

    const updated = existing.addNoteAboutResponseToQuestion({
      questionLabel,
      text: note,
      languageCode,
    });

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
