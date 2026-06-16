import { Inject } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EncryptionService } from '../../../../../libs/auth';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../../libs/data-types';
import { Survey } from '../../../survey-management';
import { SurveyResponseRecord } from '../../models/survey-response-record.aggregate-root';
import type { ISurveyResponseCommandRepository } from '../../repositories';
import { SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../repositories';
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

export interface ISurveyValidationServiceForSurveyResponses {
  fetchSurveyForParticipant(
    surveyId: string,
    hashedAccessCode: string | undefined,
  ): Promise<Survey | TrueImpactError>;
}

export class BeginSurveyCommandHandler implements ICommandHandler<BeginSurvey> {
  constructor(
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyCompletionRepository: ISurveyResponseCommandRepository,
    @Inject('SURVEY_VALIDATION_SERVICE_FOR_RESPONSES_INJECTION_TOKEN')
    private readonly surveyValidationService: ISurveyValidationServiceForSurveyResponses,
    @Inject('SURVEY_PARTICIPANT_VALIDATION_SERVICE_PROVIDER_INJECTION_TOKEN')
    private readonly participantValidationServiceProvider: ISurveyParticipantManagementServiceProvider,
    private readonly cryptoService: EncryptionService,
  ) {}

  async handle({
    payload: { surveyId, participantCompositeIdentifier, accessCode },
  }: {
    payload: BeginSurvey;
  }): Promise<CommandResult> {
    const hashedAccessCode = accessCode
      ? this.cryptoService.encrypt(accessCode)
      : undefined;

    const targetSurvey =
      await this.surveyValidationService.fetchSurveyForParticipant(
        surveyId,
        hashedAccessCode,
      );

    if (targetSurvey instanceof TrueImpactError) {
      return targetSurvey;
    }

    // TODO How does the participant interact with the access code?
    // can we pass this into the validator method?
    if (
      participantCompositeIdentifier !== null &&
      typeof participantCompositeIdentifier !== 'undefined'
    ) {
      const participantManager =
        this.participantValidationServiceProvider.forEntity(
          participantCompositeIdentifier.type,
        );

      if (participantManager instanceof TrueImpactError) {
        return participantManager;
      }

      if (
        !(await participantManager.exists(participantCompositeIdentifier.id))
      ) {
        return new TrueImpactBadUserInputError([
          new TrueImpactError(
            `Failed to begin survey [${targetSurvey.name}] on behalf of ${participantCompositeIdentifier.type}/${participantCompositeIdentifier.id}, as the participant does not exist`,
          ),
        ]);
      }
    }

    const emptyCompletionRecord = SurveyResponseRecord.begin({
      id: randomUUID(),
      survey: targetSurvey,
      participantCompositeIdentifier,
    });

    if (emptyCompletionRecord instanceof TrueImpactError) {
      return emptyCompletionRecord;
    }

    const persistenceResult = await this.surveyCompletionRepository.begin(
      emptyCompletionRecord,
    );

    // TODO move this responsibility to a write-hook on the event store
    Object.assign(persistenceResult, {
      events: emptyCompletionRecord.eventHistory,
    });

    return persistenceResult;
  }
}
