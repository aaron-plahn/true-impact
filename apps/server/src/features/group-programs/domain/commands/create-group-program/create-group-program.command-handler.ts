import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import { GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../constants';
import { GroupProgram } from '../../group-program.aggregate-root';
import type { IGroupCommandRepository } from '../group-command-repository.interface';
import { CreateGroupProgram } from './create-group-program.command';

export class CreateGroupProgramCommandHandler implements ICommandHandler<CreateGroupProgram> {
  constructor(
    @Inject(GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly groupProgramCommandRepository: IGroupCommandRepository,
  ) {}

  async handle({
    payload,
  }: {
    payload: CreateGroupProgram;
  }): Promise<CommandResult> {
    Object.assign(payload, {
      aggregateCompositeIdentifier: { id: randomUUID() },
    });

    const buildResult = GroupProgram.fromUserRequest(
      /**
       * We use Object.assign to avoid creating a clone operation for
       * an object that will never be referenced outside this path. TS
       * isn't aware of this.
       */
      payload as CreateGroupProgram & {
        aggregateCompositeIdentifier: { id: string };
      },
    );

    if (buildResult instanceof Error) {
      return buildResult;
    }

    const persistenceResult =
      await this.groupProgramCommandRepository.create(buildResult);

    if (persistenceResult instanceof Error) {
      return persistenceResult;
    }

    Object.assign(persistenceResult, {
      events: buildResult.eventHistory.at(-1),
    });

    return persistenceResult;
  }
}
