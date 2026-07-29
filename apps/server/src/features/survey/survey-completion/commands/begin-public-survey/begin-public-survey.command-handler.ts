import { ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Survey } from 'src/features/survey/survey-management';
import { SURVEY_AGGREGATE_TYPE } from '../../../../../features/survey/constants';
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

export interface ISurveyValidationServiceForBeginPublicSurvey {
  fetchForPublicConsumption(
    surveyId: string,
  ): Promise<Survey | TrueImpactError | null>;
}

export class BeginPublicSurveyCommandHandler implements ICommandHandler<BeginPublicSurvey> {
  constructor(
    @Inject('SURVEY_VALIDATION_SERVICE_FOR_RESPONSES_INJECTION_TOKEN')
    private readonly surveyValidationService: ISurveyValidationServiceForBeginPublicSurvey,
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyCompletionRepository: ISurveyResponseCommandRepository,
  ) {}

  async handle({
    payload: { surveyId },
  }: {
    payload: BeginPublicSurvey;
  }): Promise<CommandResult> {
    const targetSurvey =
      await this.surveyValidationService.fetchForPublicConsumption(surveyId);

    if (!targetSurvey) {
      return new ResourceNotFoundError({
        type: SURVEY_AGGREGATE_TYPE,
        id: surveyId,
      });
    }

    if (targetSurvey instanceof Error) {
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
