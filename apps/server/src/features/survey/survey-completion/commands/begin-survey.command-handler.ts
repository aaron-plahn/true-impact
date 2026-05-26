import { Inject, NotFoundException } from '@nestjs/common';
import { EncryptionService } from '../../../../libs/auth';
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
    // TODO wrap a service interface around this
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyCompletionRepository: ISurveyResponseCommandRepository,
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyCommandRepository: ISurveyCommandRepository,
    @Inject('SURVEY_PARTICIPANT_VALIDATION_SERVICE_PROVIDER_INJECTION_TOKEN')
    private readonly participantValidationServiceProvider: ISurveyParticipantManagementServiceProvider,
    private readonly cryptoService: EncryptionService,
  ) {}

  async handle({
    payload: { surveyId, participantCompositeIdentifier, accessCode },
  }: {
    payload: BeginSurvey;
  }): Promise<CommandResult> {
    const targetSurvey = await this.surveyCommandRepository.fetchById(surveyId);

    if (!targetSurvey) {
      throw new NotFoundException();
    }

    if (targetSurvey.requiresPasscode()) {
      if (!accessCode) {
        throw new NotFoundException();
      }

      const hashedAccessCode = this.cryptoService.encrypt(accessCode);

      if (!targetSurvey.hasAccessCode(hashedAccessCode)) {
        throw new NotFoundException();
      }

      const updatedSurvey = targetSurvey.revokeAccessdCode(hashedAccessCode);

      if (updatedSurvey instanceof TrueImpactError) {
        return updatedSurvey;
      }

      /**
       * Note that this command crosses service boundaries. As such, it consists of 2 transactions.
       * 1. ACCESS_CODE_REVOKED -> Survey
       * 2. SURVEY_BEGAN -> Survey Completion Record
       *
       * If somehow the `Survey Response` creation fails, a new code must be generated for the participant.
       */
      await this.surveyCommandRepository.update(updatedSurvey);
    }

    // TODO How does the participant interact with the access code?
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

    const userAccessTokenForSurveyCompletion =
      this.cryptoService.generatePasscode();

    const hashedUserAccessTokenForSurveyCompletion = this.cryptoService.encrypt(
      userAccessTokenForSurveyCompletion,
    );

    const emptyCompletionRecord = SurveyResponseRecord.begin({
      survey: targetSurvey,
      participantCompositeIdentifier,
      hashedAccessCode: hashedUserAccessTokenForSurveyCompletion,
    });

    if (emptyCompletionRecord instanceof TrueImpactError) {
      return emptyCompletionRecord;
    }

    const persistenceResult = await this.surveyCompletionRepository.begin(
      emptyCompletionRecord,
    );

    Object.assign(persistenceResult, {
      accessCode: userAccessTokenForSurveyCompletion,
    });

    return persistenceResult;
  }
}
