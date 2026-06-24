import { Inject } from '@nestjs/common';
import { CommandResult, ICommandHandler } from '../../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../../libs/data-types';
import { GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../constants';
import type { IGroupProgramCommandRepository } from '../group-command-repository.interface';
import { ScheduleGroupProgramSession } from './schedule-group-program-session.command';

export class ScheduleGroupProgramSessionCommandHandler implements ICommandHandler<ScheduleGroupProgramSession> {
  constructor(
    @Inject(GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly groupProgramRepository: IGroupProgramCommandRepository,
  ) {}

  async handle({
    payload: {
      aggregateCompositeIdentifier: { id },
      location,
      date,
    },
  }: {
    payload: ScheduleGroupProgramSession;
  }): Promise<CommandResult> {
    const target = await this.groupProgramRepository.fetchById(id);

    if (!target) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot schedule a session of group program: ${id} as there is no such program`,
        ),
      ]);
    }

    const updateResult = target.scheduleSession({
      location,
      date,
    });

    if (updateResult instanceof Error) {
      return updateResult;
    }

    const persistenceResult =
      await this.groupProgramRepository.update(updateResult);

    // TODO deal with events

    return persistenceResult;
  }
}
