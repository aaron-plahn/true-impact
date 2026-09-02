import { Inject } from '@nestjs/common';
import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import { TrueImpactError } from 'src/libs/data-types';
import {
  SurveyViewModel,
  SurveyViewModelClientDto,
} from '../../queries/survey.view-model';
import { SurveyResponseRecord } from '../models';
import type { ISurveyResponseQueryRepository } from '../queries';
import { SurveyResponseRecordViewModel } from '../queries/survey-response-record.view-model';
import {
  SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN,
  type ISurveyResponseCommandRepository,
} from './survey-response-command-repository.interface';

export class InMemorySurveyResponseQueryRepository implements ISurveyResponseQueryRepository {
  constructor(
    @Inject(SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly commandRepository: ISurveyResponseCommandRepository,
  ) {}

  async fetchById(id: string): Promise<SurveyResponseRecordViewModel | null> {
    const domainModel = await this.commandRepository.fetchById(id);

    if (!domainModel) {
      return null;
    }

    const viewModel = this.buildViewModel(domainModel);

    return viewModel;
  }

  async fetchMany(): Promise<SurveyResponseRecordViewModel[]> {
    const domainModels = await this.commandRepository.fetchMany();

    const viewModels = domainModels.map((dm) => this.buildViewModel(dm));

    return viewModels;
  }

  create(
    _instance: SurveyResponseRecordViewModel,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    throw new Error('Method not implemented.');
  }

  createMany(_instances: SurveyResponseRecordViewModel[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private buildViewModel(
    domainModel: SurveyResponseRecord,
  ): SurveyResponseRecordViewModel {
    const viewOfCachedSurvey = SurveyViewModel.fromDomainModel(
      domainModel.survey,
      {
        // these won't be available here yet
        flags: new Map(),
      },
    ).toClientDto();

    const surveysById = new Map<string, SurveyViewModelClientDto>().set(
      viewOfCachedSurvey.id,
      viewOfCachedSurvey,
    );

    const viewModel = SurveyResponseRecordViewModel.fromDomainModel(
      domainModel,
      { surveysById },
    );

    return viewModel;
  }
}
