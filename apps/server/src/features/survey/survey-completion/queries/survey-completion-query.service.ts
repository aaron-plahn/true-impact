import { Inject } from '@nestjs/common';
import type { ISurveyCompletionCommandRepository } from '../repositories';
import { SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../repositories';
import { SurveyResponseRecord } from '../survey-response-record.aggregate-root';
import { SurveyCompletionRecordViewModel } from './survey-completion-record.view-model';

export class SurveyCompletionQueryService {
  constructor(
    @Inject(SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyCompletionCommandRepository: ISurveyCompletionCommandRepository,
  ) {}

  async fetchById(id: string) {
    const domainModel =
      await this.surveyCompletionCommandRepository.fetchById(id);

    if (!domainModel) {
      return null; // not found error?
    }

    return this.buildViewModelFromDomainModel(domainModel);
  }

  // TODO stick to completion record **or** response record in all naming
  private buildViewModelFromDomainModel(domainModel: SurveyResponseRecord) {
    // TODO inject client and survey state
    return SurveyCompletionRecordViewModel.fromDomainModel(domainModel);
  }
}
