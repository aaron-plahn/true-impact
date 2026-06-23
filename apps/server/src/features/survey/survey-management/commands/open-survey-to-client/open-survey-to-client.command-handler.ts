import { Inject } from '@nestjs/common';
import { CLIENT_AGGREGATE_TYPE } from '../../../../../features/clients/client.composite-identifier';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../../../../features/survey/constants';
import type { ISurveyCommandRepository } from '../../../../../features/survey/repositories';
import { EncryptionService } from '../../../../../libs/auth';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import {
  ResourceNotFoundError,
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../../libs/data-types';
import { Survey } from '../../survey.aggregate-root';
import { OpenSurveyToClient } from './open-survey-to-client.command';

export interface IParticipantValidationServiceForSurveys {
  exists(participantId: string): Promise<boolean>;
}

export interface IParticipantValidatorProvider {
  forEntity(
    participantType: string,
  ): IParticipantValidationServiceForSurveys | ResourceNotFoundError;
}

export class OpenSurveyToClientCommandHandler implements ICommandHandler<OpenSurveyToClient> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyCommandRepository: ISurveyCommandRepository,
    private readonly encryptionService: EncryptionService,
    @Inject('SURVEY_PARTICIPANT_VALIDATION_SERVICE_PROVIDER_INJECTION_TOKEN')
    private readonly participantValidationServiceProvider: IParticipantValidatorProvider,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      clientId,
    },
  }: {
    payload: OpenSurveyToClient;
  }): Promise<CommandResult> {
    const requiredStateErrors: TrueImpactError[] = [];

    const participantValidator =
      this.participantValidationServiceProvider.forEntity(
        CLIENT_AGGREGATE_TYPE,
      );

    if (participantValidator instanceof Error) {
      return participantValidator;
    }

    const doesParticipantExist = await participantValidator.exists(clientId);

    if (!doesParticipantExist) {
      requiredStateErrors.push(
        new ResourceNotFoundError({
          type: CLIENT_AGGREGATE_TYPE,
          id: clientId,
        }),
      );
    }

    const surveyFetchResult = await this.surveyCommandRepository.fetchById(id);

    if (!surveyFetchResult) {
      requiredStateErrors.push(
        new TrueImpactError(
          `You cannot open survey ${id} to a client, as there is no such survey.`,
        ),
      );
    }

    if (requiredStateErrors.length > 0) {
      return new TrueImpactBadUserInputError(requiredStateErrors);
    }

    const generatedOnetimePasscode = this.encryptionService.generatePasscode();

    const hashedPasscode = this.encryptionService.encrypt(
      generatedOnetimePasscode,
    );

    const target = surveyFetchResult as Survey;

    const updatedResult = target.openToParticipant({
      dateOfExpiry: '12345',
      dateOpened: '123',
      hash: hashedPasscode,
      /**
       * TODO validation via a participant validation service
       * 1. the type here must be an allowed participant type
       * 2. the client must exist
       */
      participantCompositeIdentifier: {
        id: clientId,
        type: CLIENT_AGGREGATE_TYPE,
      },
    });

    if (updatedResult instanceof Error) {
      return updatedResult;
    }

    const result = await this.surveyCommandRepository.update(updatedResult);

    if (result instanceof Error) {
      return result;
    }

    Object.assign(result, {
      accessCode: generatedOnetimePasscode,
      // TODO Persist the event
      // events: updatedResult.eventHistory.at(-1),
    });

    return result;
  }
}
