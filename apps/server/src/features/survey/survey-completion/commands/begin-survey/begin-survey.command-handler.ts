import { ForbiddenException, Inject } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EncryptionService } from '../../../../../libs/auth';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../../libs/data-types';
import { Survey } from '../../../survey-management';
import { SurveyParticipantCompositeIdentifier } from '../../models';
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

interface SurveyAndParticipant {
  survey: Survey;
  participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;
}

export interface ISurveyValidationServiceForSurveyResponses {
  fetchSurveyForParticipant(
    surveyId: string,
    hashedAccessCode: string | undefined,
  ): Promise<SurveyAndParticipant | TrueImpactError>;
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
    payload: { surveyId, accessCode },
  }: {
    payload: BeginSurvey;
  }): Promise<CommandResult> {
    const hashedAccessCode = accessCode
      ? this.cryptoService.encrypt(accessCode)
      : undefined;

    const surveyFetchResult =
      await this.surveyValidationService.fetchSurveyForParticipant(
        surveyId,
        hashedAccessCode,
      );

    if (surveyFetchResult instanceof TrueImpactError) {
      /**
       * I'd prefer to return this error.
       */
      throw new ForbiddenException();
    }

    const { participantCompositeIdentifier, survey: targetSurvey } =
      surveyFetchResult;

    const newSurveyAttemptId = randomUUID();

    /**
     * Currently we are not hitting this path. Eventually,
     * employees will be able to begin a survey if that
     * survey permits employees (or the specific employee by ID)
     * to participate.
     */
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

      /**
       * There is an edge case where the user is starting a survey for which they already have in
       * progress. Because preventing this case crosses transactional (aggregate root) boundaries,
       * we don't want to validate this here. Instead, we delete views for the previous attempts
       * in the (eventually consistent) view model. By the time a user starts a new attempt, the old
       * one will disappear from the UX.
       */
    }

    const emptyCompletionRecord = SurveyResponseRecord.begin({
      id: newSurveyAttemptId,
      survey: targetSurvey,
      participantCompositeIdentifier,
    });

    if (emptyCompletionRecord instanceof TrueImpactError) {
      return emptyCompletionRecord;
    }

    const persistenceResult = await this.surveyCompletionRepository.create(
      emptyCompletionRecord,
    );

    // TODO move this responsibility to a write-hook on the event store
    Object.assign(persistenceResult, {
      events: emptyCompletionRecord.eventHistory,
    });

    return persistenceResult;
  }
}
