import { Inject } from '@nestjs/common';
import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyResponseRecord } from '../models/survey-response-record.aggregate-root';
import type { ISurveyResponseCommandRepository } from '../repositories';
import { SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../repositories';

export class SurveyResponseValidationService {
  constructor(
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyResponseCommandRepository: ISurveyResponseCommandRepository,
  ) {}

  async fetchForReview(
    surveyResponseId: string,
  ): Promise<SurveyResponseRecord | TrueImpactError> {
    const target =
      await this.surveyResponseCommandRepository.fetchById(surveyResponseId);

    if (!target) {
      return new TrueImpactError(
        `There is no survey response ${surveyResponseId} available for review.`,
      );
    }

    if (!target.isComplete()) {
      return new TrueImpactError(
        `You cannot review attempt: ${target.getId()} of survey: ${target.survey.getName()}, as this attempt has not been completed.`,
      );
    }

    return target;
  }
}
