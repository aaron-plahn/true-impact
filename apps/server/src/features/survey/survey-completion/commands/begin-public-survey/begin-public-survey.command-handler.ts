import { ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  SURVEY_AGGREGATE_TYPE,
  SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN,
} from '../../../../../features/survey/constants';
import type { ISurveyCommandRepository } from '../../../../../features/survey/repositories';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import {
  ResourceNotFoundError,
  TrueImpactError,
} from '../../../../../libs/data-types';
import { Inject } from '../../../../../libs/framework';
import { SurveyResponseRecord } from '../../models';
import {
  SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN,
  type ISurveyResponseCommandRepository,
} from '../../repositories';
import { BeginPublicSurvey } from './begin-public-survey.command';

export class BeginPublicSurveyCommandHandler implements ICommandHandler<BeginPublicSurvey> {
  constructor(
    // TODO use a `SurveyValidationService` to decouple at the DB layer
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyRepository: ISurveyCommandRepository,
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyCompletionRepository: ISurveyResponseCommandRepository,
  ) {}

  async handle({
    payload: { surveyId },
  }: {
    payload: BeginPublicSurvey;
  }): Promise<CommandResult> {
    const targetSurvey = await this.surveyRepository.fetchById(surveyId);

    if (!targetSurvey) {
      return new ResourceNotFoundError({
        type: SURVEY_AGGREGATE_TYPE,
        id: surveyId,
      });
    }

    if (!targetSurvey.isOpenToPublic) {
      throw new ForbiddenException();
    }

    const newSurveyAttemptId = randomUUID();

    const emptyCompletionRecord = SurveyResponseRecord.begin({
      id: newSurveyAttemptId,
      survey: targetSurvey,
    });

    if (emptyCompletionRecord instanceof TrueImpactError) {
      return emptyCompletionRecord;
    }

    const persistenceResult = await this.surveyCompletionRepository.begin(
      emptyCompletionRecord,
    );

    Object.assign(persistenceResult, {
      events: emptyCompletionRecord.eventHistory,
    });

    return persistenceResult;
  }
}
