import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { Community } from '../models';
import { CreateCommunity } from './create-community.command';
import type { ICommunityCommandRepository } from './repositories/community-command-repository.interface';

interface ILanguageValidationService {
  has(languageCode: string): boolean;
}

export class CreateCommunityCommandHandler implements ICommandHandler<CreateCommunity> {
  private readonly languageValidationService: ILanguageValidationService = {
    has(languageCode: string): boolean {
      return ['en', 'clc'].includes(languageCode);
    },
  };

  constructor(
    @Inject(COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ICommunityCommandRepository,
  ) {}

  async handle({
    payload: clientRequestDto,
  }: {
    payload: CreateCommunity;
  }): Promise<CommandResult> {
    const { languageCodeForName } = clientRequestDto;

    if (!this.languageValidationService.has(languageCodeForName)) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot create a community with a name in the unknown language [${languageCodeForName}]`,
        ),
      ]);
    }

    const newInstance = Community.fromUserRequest(clientRequestDto);

    if (newInstance instanceof TrueImpactError) {
      return newInstance;
    }

    const persistenceResult = await this.repository.create(newInstance);

    if (persistenceResult instanceof TrueImpactError) {
      return new TrueImpactBadUserInputError([persistenceResult]);
    }

    return persistenceResult;
  }
}
