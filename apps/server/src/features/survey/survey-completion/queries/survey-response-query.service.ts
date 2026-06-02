import { Inject } from '@nestjs/common';
import { SurveyResponseRecord } from '../models/survey-response-record.aggregate-root';
import type { ISurveyResponseCommandRepository } from '../repositories';
import { SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../repositories';
import { SurveyResponseRecordViewModel } from './survey-response-record.view-model';

export class SurveyResponseQueryService {
  constructor(
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly surveyCompletionCommandRepository: ISurveyResponseCommandRepository,
  ) {}

  async fetchById(id: string): Promise<SurveyResponseRecordViewModel | null> {
    const domainModel =
      await this.surveyCompletionCommandRepository.fetchById(id);

    if (!domainModel) {
      return null; // not found error?
    }

    return this.buildViewModel(domainModel);
  }

  async fetchMany() {
    const domainModels =
      await this.surveyCompletionCommandRepository.fetchMany();

    return domainModels.map((dm) => this.buildViewModel(dm));
  }

  // TODO stick to completion record **or** response record in all naming
  private buildViewModel(domainModel: SurveyResponseRecord) {
    // TODO inject client state
    return SurveyResponseRecordViewModel.fromDomainModel(domainModel);
  }
}
