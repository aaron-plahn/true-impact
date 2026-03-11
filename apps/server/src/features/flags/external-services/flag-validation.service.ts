import { Inject } from '@nestjs/common';
import { FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../constants';
import type { IFlagCommandRepository } from '../repositories';

export class FlagValidationService {
  constructor(
    @Inject(FLAG_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly commandRepository: IFlagCommandRepository,
  ) {}

  exists(flagId: string): Promise<boolean> {
    return this.commandRepository.exists(flagId);
  }
}
