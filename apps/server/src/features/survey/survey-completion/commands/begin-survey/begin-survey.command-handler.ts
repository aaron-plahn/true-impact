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

      const surveyResponsesAlreadyInProgress =
        await this.surveyCompletionRepository.fetchSurveyForParticipant(
          participantCompositeIdentifier,
          surveyId,
        );

      if (surveyResponsesAlreadyInProgress instanceof Error) {
        return new TrueImpactBadUserInputError([
          surveyResponsesAlreadyInProgress,
        ]);
      }

      /**
       * Note that this is not atomic. It's possible that we cancel the
       * existing attempt but the request to begin the new attempt fails.
       * This is a better state than allowing the user to begin the new survey
       * but potentially failing to cancel an existing in-progress survey response
       * session.
       */
      if (surveyResponsesAlreadyInProgress.length > 0) {
        const errorsFromCancellingExistingSessions: TrueImpactError[] = [];

        for (const r of surveyResponsesAlreadyInProgress) {
          const updatedR = r.cancel({
            replacementAttemptId: newSurveyAttemptId,
          });

          if (updatedR instanceof Error) {
            errorsFromCancellingExistingSessions.push(updatedR);
          } else {
            await this.surveyCompletionRepository.update(updatedR);
          }
        }

        if (errorsFromCancellingExistingSessions.length > 1) {
          return new TrueImpactBadUserInputError(
            errorsFromCancellingExistingSessions,
          );
        }
      }
    }

    const emptyCompletionRecord = SurveyResponseRecord.begin({
      id: newSurveyAttemptId,
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
