import type { ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import {
  BadUserInputFilter,
  Body,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  IndexQueryEndpoint,
  Post,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  TestSetupEndpoint,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';
import { FlagQueryService, FlagViewModelClientDto } from './queries';

// TODO Can we wrap these into @Controller?
@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('flags')
export class FlagController {
  constructor(
    private readonly flagQueryService: FlagQueryService,
    private readonly commandHandlerService: CommandHandlerService,
  ) {}

  // TODO @CommandExecutionEndpoint
  @Post('commands')
  async executeCommand(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }

  @DetailQueryEndpoint()
  async fetchById(
    @IdParam()
    id: string,
  ): Promise<FlagViewModelClientDto | TrueImpactError | null> {
    const result = await this.flagQueryService.fetchById(id);

    return result;
  }

  // TODO do we want to use an interceptor to convert view models to client-facing DTOs insead of doing it explicitly lower down?
  @IndexQueryEndpoint()
  async fetchMany() {
    const result = await this.flagQueryService.fetchMany();

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
    await this.flagQueryService.flagCommandRepository.clear();

    return 'OK';
  }
}
