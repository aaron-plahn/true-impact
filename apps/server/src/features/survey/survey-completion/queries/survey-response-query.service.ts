import { Inject } from '@nestjs/common';
import { isDeepStrictEqual } from 'util';
import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyQueryService } from '../../queries/survey-query.service';
import { SurveyViewModelClientDto } from '../../queries/survey.view-model';
import { SurveyParticipantCompositeIdentifier } from '../models';
import { SurveyResponseRecord } from '../models/survey-response-record.aggregate-root';
import type { ISurveyResponseCommandRepository } from '../repositories';
import { SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../repositories';
import { SurveyResponseRecordViewModel } from './survey-response-record.view-model';

export class SurveyResponseQueryService {
  constructor(
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyCompletionCommandRepository: ISurveyResponseCommandRepository,
    private readonly surveyQueryService: SurveyQueryService,
  ) {}

  async fetchById(
    id: string,
  ): Promise<SurveyResponseRecordViewModel | null | TrueImpactError> {
    const domainModel =
      await this.surveyCompletionCommandRepository.fetchById(id);

    if (!domainModel) {
      return null; // not found error?
    }

    const { survey } = domainModel;

    const mostRecentVersionOfSurvey = await this.surveyQueryService.fetchById(
      survey.id,
    );

    if (mostRecentVersionOfSurvey instanceof Error) {
      return new TrueImpactError(
        `Failed to fetch response [${id}] to survey [${survey.name}] when fetching the report information from the survey.`,
      );
    }

    if (!mostRecentVersionOfSurvey) {
      return new TrueImpactError(
        `Failed to fetch response [${id}] to survey [${survey.name}] when fetching the report information for the given survey, as the survey was not found.`,
      );
    }

    return this.buildViewModel(domainModel, {
      surveysById: new Map<string, SurveyViewModelClientDto>().set(
        survey.id,
        mostRecentVersionOfSurvey,
      ),
    });
  }

  async forParticipant(
    participantCompositeIdentifier: SurveyParticipantCompositeIdentifier,
  ): Promise<TrueImpactError | SurveyResponseRecordViewModel[]> {
    /**
     * TODO Optimize this. We might want to just shift to event sourcing views.
     */
    const allResponses = await this.fetchMany();

    if (allResponses instanceof Error) {
      return allResponses;
    }

    const responsesForParticipant = allResponses.filter((r) =>
      isDeepStrictEqual(
        r.participantCompositeIdentifier,
        participantCompositeIdentifier,
      ),
    );

    return responsesForParticipant;
  }

  async fetchMany() {
    const surveys = await this.surveyQueryService.fetchMany();

    const surveysById = new Map<string, SurveyViewModelClientDto>();

    if (surveys instanceof Error) {
      return new TrueImpactError(
        `Failed to fetch updated surveys when fetching survey responses.`,
        [surveys],
      );
    }

    surveys.forEach((s) => {
      surveysById.set(s.id, s);
    });

    const domainModels =
      await this.surveyCompletionCommandRepository.fetchMany();

    return domainModels.map((dm) => this.buildViewModel(dm, { surveysById }));
  }

  // TODO stick to completion record **or** response record in all naming
  private buildViewModel(
    domainModel: SurveyResponseRecord,
    context: { surveysById: Map<string, SurveyViewModelClientDto> },
  ) {
    /**
     * We could consider putting the client info on the response record.
     *
     * For now, we traverse Clients -> Reports instead because this is a
     * more natural way for clinicians to find a specific report.
     */
    return SurveyResponseRecordViewModel.fromDomainModel(domainModel, context);
  }
}
