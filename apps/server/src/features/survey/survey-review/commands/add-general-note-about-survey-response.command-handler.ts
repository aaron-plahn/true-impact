import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { AddGeneralNoteAboutSurveyResponse } from './add-general-note-about-survey-response.command';
import type { ISurveyReviewCommandRepository } from './survey-review-command-repository.interface';

export class AddGeneralNoteAboutSurveyResponseCommandHandler implements ICommandHandler<AddGeneralNoteAboutSurveyResponse> {
  constructor(
    @Inject(SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ISurveyReviewCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      note,
      languageCode,
    },
  }: {
    payload: AddGeneralNoteAboutSurveyResponse;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(id)) ||
      new TrueImpactError(
        `You cannot add a general note about survey attempt [${id}], as there is no such attempt.`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const updated = existing.addGeneralNote({ text: note, languageCode });

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
