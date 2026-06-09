import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs/data-types';
import type { CommandResult, ICommandFsa } from '../../../libs/cqrs-es';
import { CommandHandlerService } from '../../../libs/cqrs-es';
import {
  BadUserInputFilter,
  Body,
  Controller,
  Inject,
  Post,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  TestSetupEndpoint,
  UseFilters,
  UseInterceptors,
} from '../../../libs/framework';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import type { IUserCommandRepository } from '../repositories';

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('users')
export class UserCommandController {
  constructor(
    private readonly commandHandlerService: CommandHandlerService,
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly commandRepository: IUserCommandRepository,
  ) {}

  // TODO @CommandExecutionEndpoint
  @Post('commands')
  async executeCommand(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }

  @TestSetupEndpoint()
  async testSetup(): Promise<'OK'> {
    if (process.env.NODE_ENV !== 'test') {
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

  // TODO onModuleInit buildApiDocs
}
