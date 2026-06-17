import { Inject } from '@nestjs/common';
import { CLIENT_AGGREGATE_TYPE } from '../../../../../features/clients/client.composite-identifier';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../../../../features/survey/constants';
import type { ISurveyCommandRepository } from '../../../../../features/survey/repositories';
import { EncryptionService } from '../../../../../libs/auth';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../../libs/data-types';
import { OpenSurveyToClient } from './open-survey-to-client.command';

export class OpenSurveyToClientCommandHandler implements ICommandHandler<OpenSurveyToClient> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyCommandRepository: ISurveyCommandRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      clientId,
    },
  }: {
    payload: OpenSurveyToClient;
  }): Promise<CommandResult> {
    const target = await this.surveyCommandRepository.fetchById(id);

    if (!target) {
      return new TrueImpactError(
        `You cannot open survey ${id} to a client, as there is no such survey.`,
      );
    }

    const generatedOnetimePasscode = this.encryptionService.generatePasscode();

    const hashedPasscode = this.encryptionService.encrypt(
      generatedOnetimePasscode,
    );

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

    Object.assign(result, { accessCode: generatedOnetimePasscode });

    return result;
  }
}
