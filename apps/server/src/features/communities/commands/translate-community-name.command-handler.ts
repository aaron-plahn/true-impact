import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../libs/cqrs-es';
import { TrueImpactError } from '../../../libs/data-types';
import { COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { ICommunityCommandRepository } from './repositories/community-command-repository.interface';
import { TranslateCommunityName } from './translate-community-name.command';

export class TranslateCommunityNameCommandHandler implements ICommandHandler<TranslateCommunityName> {
  constructor(
    @Inject(COMMUNITY_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ICommunityCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      translation,
      languageCode,
    },
  }: {
    payload: TranslateCommunityName;
  }): Promise<CommandResult> {
    const existing =
      (await this.repository.fetchById(id)) ||
      new TrueImpactError(
        `You cannot translate the name of community [${id}], as there is no such community.`,
      );

    if (existing instanceof TrueImpactError) {
      return existing;
    }

    const updated = existing.translateName({ text: translation, languageCode });

    if (updated instanceof TrueImpactError) {
      return updated;
    }

    const persistenceResult = await this.repository.update(updated);

    return persistenceResult;
  }
}
