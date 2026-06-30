import {
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthenticatedUserGuard, RbacAuthGuard } from '../../../auth/guards';
import { UserCommandController } from '../../../features/users/commands/user-command.controller';
import type { ICommandFsa } from '../../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../libs/data-types';
import {
  QueryResponseInterceptor,
  TestSetupEndpoint,
} from '../../../libs/framework';
import {
  BadUserInputFilter,
  ResourceNotFoundFilter,
  UseFilters,
} from '../../../libs/framework/exceptions';
import type { IGroupProgramCommandRepository } from './commands/group-command-repository.interface';
import { GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN } from './constants';

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('group-programs')
export class GroupProgramCommandController {
  constructor(
    private readonly commandHandlerService: CommandHandlerService,
    @Inject(GROUP_PROGRAM_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly commandRepository: IGroupProgramCommandRepository,
  ) {}

  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  // TODO @CommandExecutionEndpoint
  @Post('commands')
  async executeCommand(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }

  // TODO auth guards
  @TestSetupEndpoint()
  async testSetup(): Promise<'OK'> {
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'e2e') {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot access test setup helpers in the environment [${process.env.NODE_ENV}]`,
        ),
      ]);
    }

    // @ts-expect-error This will only work if the private, concrete dependency has a `clear` method (not for the production implementation)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.commandRepository.clear();

    return 'OK';
  }

  onModuleInit() {
    this.commandHandlerService.buildApiDocs(
      UserCommandController,
      'executeCommand',
    );
  }
}
