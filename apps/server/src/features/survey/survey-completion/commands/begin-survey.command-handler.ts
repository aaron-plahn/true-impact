import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from 'src/libs/data-types';
import {
  SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN,
  SURVEY_RESPONSE_AGGREAGTE_TYPE,
} from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories';
import type { ISurveyCompletionCommandRepository } from '../repositories';
import { SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../repositories';
import { SurveyResponseRecord } from '../survey-response-record.aggregate-root';
import { BeginSurvey } from './begin-survey.command';

export class BeginSurveyCommandHandler implements ICommandHandler<BeginSurvey> {
  constructor(
    @Inject(SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyCompletionRepository: ISurveyCompletionCommandRepository,
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyCommandRepository: ISurveyCommandRepository,
  ) {}

  async handle({
    payload: { surveyId, participantCompositeIdentifier },
  }: {
    payload: BeginSurvey;
  }): Promise<CommandResult> {
    if (!participantCompositeIdentifier) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Completing surveys anonymously is not yet supported.`,
        ),
      ]);
    }

    const targetSurvey = await this.surveyCommandRepository.fetchById(surveyId);

    if (!targetSurvey) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot begin survey [${surveyId}], as there is no survey with that ID.`,
        ),
      ]);
    }

    const emptyCompletionRecord = SurveyResponseRecord.begin(
      targetSurvey,
      participantCompositeIdentifier,
    );

    if (emptyCompletionRecord instanceof TrueImpactError) {
      return emptyCompletionRecord;
    }

    const result = await this.surveyCompletionRepository.create(
      emptyCompletionRecord,
    );

    if (result instanceof TrueImpactError) {
      return result;
    }

    return {
      id: result,
      revision: '1',
      // be sure to make this consistent with the eventual naming convention
      type: SURVEY_RESPONSE_AGGREAGTE_TYPE,
    };
  }
}
