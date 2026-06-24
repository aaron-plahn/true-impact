import { EncryptionService } from '../../../../libs/auth';
import { CommandResult, ICommandHandler } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { Inject } from '../../../../libs/framework';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories/survey-command-repository.interface';
import { OpenSurveyToAnonymousIndividual } from './open-survey-to-anonymous-individual.command';

export class OpenSurveyToAnonymousIndividualCommandHandler implements ICommandHandler<OpenSurveyToAnonymousIndividual> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyRepository: ISurveyCommandRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
    },
  }: {
    payload: OpenSurveyToAnonymousIndividual;
  }): Promise<CommandResult> {
    const target = await this.surveyRepository.fetchById(id);

    if (!target) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to update survey: ${id}, as there is no such survey.`,
        ),
      ]);
    }

    const generatedOnetimePasscode = this.encryptionService.generatePasscode();

    const hashedPassocde = this.encryptionService.encrypt(
      generatedOnetimePasscode,
    );

    const updateResult = target.openToAnonymousIndividual({
      dateOfExpiry: '12345',
      dateOpened: '123',
      hash: hashedPassocde,
    });

    if (updateResult instanceof TrueImpactError) {
      return updateResult;
    }

    const result = await this.surveyRepository.update(updateResult);

    if (result instanceof TrueImpactError) {
      return result;
    }

    /**
     * This is sent in the clear to the user, but encrypted for persistence. If the user
     * doesn't store this code, it cannot be retrieved. A new code must be generated.
     */
    Object.assign(result, { accessCode: generatedOnetimePasscode });

    return result;
  }
}
