import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories';
import { SurveyResponseRecord } from '../models/survey-response-record.aggregate-root';
import type { ISurveyResponseCommandRepository } from '../repositories';
import { SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../repositories';
import { BeginSurvey } from './begin-survey.command';

interface ISurveyParticipantManagementService {
  exists(id: string): Promise<boolean>;
}

export const SURVEY_PARTICIPANT_VALIDATION_SERVICE_PROVIDER_INJECTION_TOKEN =
  'SURVEY_PARTICIPANT_VALIDATION_SERVICE_PROVIDER_INJECTION_TOKEN';

interface ISurveyParticipantManagementServiceProvider {
  forEntity(
    type: string,
  ): ISurveyParticipantManagementService | TrueImpactError;
}

export class BeginSurveyCommandHandler implements ICommandHandler<BeginSurvey> {
  constructor(
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyCompletionRepository: ISurveyResponseCommandRepository,
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyCommandRepository: ISurveyCommandRepository,
    @Inject('SURVEY_PARTICIPANT_VALIDATION_SERVICE_PROVIDER_INJECTION_TOKEN')
    private readonly participantValidationServiceProvider: ISurveyParticipantManagementServiceProvider,
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
          `You cannot begin survey [${surveyId}], as there is no survey with the given ID.`,
        ),
      ]);
    }

    const participantManager =
      this.participantValidationServiceProvider.forEntity(
        participantCompositeIdentifier.type,
      );

    if (participantManager instanceof TrueImpactError) {
      return participantManager;
    }

    if (!(await participantManager.exists(participantCompositeIdentifier.id))) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to begin survey [${targetSurvey.name}] on behalf of ${participantCompositeIdentifier.type}/${participantCompositeIdentifier.id}, as the participant does not exist`,
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

    const persistenceResult = await this.surveyCompletionRepository.begin(
      emptyCompletionRecord,
    );

    return persistenceResult;
  }
}
