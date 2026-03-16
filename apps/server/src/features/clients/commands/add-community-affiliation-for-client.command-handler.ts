import { Inject } from '@nestjs/common';
import { COMMUNITY_VALIDATION_SERVICE_INJECTION_TOKEN } from '../../../features/communities/constants';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IClientCommandRepository } from '../repositories';
import { AddCommunityAffiliationForClient } from './add-community-affiliation-for-client';

interface ICommunityValidationService {
  exists(communityId: string): Promise<boolean>;
}

export class AddCommunityAffiliationForClientCommandHandler implements ICommandHandler<AddCommunityAffiliationForClient> {
  constructor(
    @Inject(CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: IClientCommandRepository,
    @Inject(COMMUNITY_VALIDATION_SERVICE_INJECTION_TOKEN)
    private readonly communityValidationService: ICommunityValidationService,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id: clientId },
      communityId,
    },
  }: {
    payload: AddCommunityAffiliationForClient;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(clientId)) ||
      new TrueImpactError(
        `You cannot add a community for client [${clientId}], as there is no such client`,
      );

    if (existing instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([existing]);
    }

    const doesCommunityExist =
      await this.communityValidationService.exists(communityId);

    if (!doesCommunityExist) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot add community [${communityId}] for client [${clientId}], as there is no such community.`,
        ),
      ]);
    }

    const updated = existing.addCommunityAffiliation(communityId);

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
