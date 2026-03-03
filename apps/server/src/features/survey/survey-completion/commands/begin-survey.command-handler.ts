import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../constants';
import type { ISurveyCommandRepository } from '../../repositories';
import type { ISurveyCompletionCommandRepository } from '../repositories';
import { SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../repositories';
import { SurveyResponseRecord } from '../survey-response-record.aggregate-root';
import { BeginSurvey } from './begin-survey.command';

interface ISurveyParticipantManagementService {
  exists(id: string): Promise<boolean>;
}

export const SURVEY_PARTICIPANT_MANAGEMENT_SERVICE_PROVIDER_INJECTION_TOKEN =
  'SURVEY_PARTICIPANT_MANAGEMENT_SERVICE_PROVIDER_INJECTION_TOKEN';

interface ISurveyParticipantManagementServiceProvider {
  forEntity(
    type: string,
  ): ISurveyParticipantManagementService | TrueImpactError;
}

export class BeginSurveyCommandHandler implements ICommandHandler<BeginSurvey> {
  constructor(
    @Inject(SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyCompletionRepository: ISurveyCompletionCommandRepository,
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly surveyCommandRepository: ISurveyCommandRepository,
    @Inject('SURVEY_PARTICIPANT_MANAGEMENT_SERVICE_PROVIDER_INJECTION_TOKEN')
    private readonly participantManagementProvider: ISurveyParticipantManagementServiceProvider,
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

    const participantManager = this.participantManagementProvider.forEntity(
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
