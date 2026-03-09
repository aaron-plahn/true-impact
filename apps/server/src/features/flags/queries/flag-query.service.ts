import { Inject } from '@nestjs/common';
import { TrueImpactError } from 'src/libs/data-types';
import { FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
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
}
