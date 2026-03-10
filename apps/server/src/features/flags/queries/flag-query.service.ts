import { TrueImpactError } from '../../../libs/data-types';
import { Inject } from '../../../libs/framework';
import { FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
import { Flag } from '../models';
import type { IFlagCommandRepository } from '../repositories';
import { FlagViewModel, FlagViewModelClientDto } from './flag.view-model';

export class FlagQueryService {
  constructor(
    @Inject(FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly flagCommandRepository: IFlagCommandRepository,
  ) {}

  async fetchById(
    id: string,
  ): Promise<FlagViewModelClientDto | TrueImpactError> {
    const domainModelSearchResult =
      (await this.flagCommandRepository.fetchById(id)) ||
      // shouldn't this map to a 404 at the top level?
      new TrueImpactError(
        `Failed to fetch flag [${id}], as there is no flag with this ID.`,
      );

    if (domainModelSearchResult instanceof TrueImpactError) {
      return domainModelSearchResult;
    }

    return FlagViewModel.fromDomainModel(domainModelSearchResult).toClientDto();
  }

  async fetchMany(): Promise<FlagViewModelClientDto[] | TrueImpactError> {
    const domainModels = await this.flagCommandRepository.fetchMany();

    return domainModels.map((dm) => this.buildViewModel(dm));
  }

  private buildViewModel(domainModel: Flag): FlagViewModelClientDto {
    return FlagViewModel.fromDomainModel(domainModel).toClientDto();
  }
}
