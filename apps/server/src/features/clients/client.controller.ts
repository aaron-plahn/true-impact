import type { CommandResult, ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService } from '../../libs/cqrs-es';

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
import { ClientQueryService } from './services/client-query.service';

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('clients')
export class ClientController {
  constructor(
    private readonly clientsService: ClientQueryService,
    private readonly commandHandlerService: CommandHandlerService,
  ) {}

  @DetailQueryEndpoint()
  async fetchById(@IdParam() id: string) {
    const result = await this.clientsService.fetchById(id);

    return result;
  }

  @IndexQueryEndpoint()
  async fetchMany() {
    // TODO We need a client view model
    return this.clientsService.fetchMany();
  }

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
    await this.clientsService.repository.clear();

    return 'OK';
  }
}
