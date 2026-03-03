import type { CommandResult, IUpdateCommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService } from '../../libs/cqrs-es';

import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs/data-types';
import {
  BadUserInputFilter,
  Body,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  Patch,
  Post,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';
import { CreateClient } from './commands/create-client.command';
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
    return this.clientsService.fetchById(id);
  }

  @Post('commands')
  async executeCommand(@Body() fsa: IUpdateCommandFsa): Promise<CommandResult> {
    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }

  // TODO We want a dedicated /commands endpoint for extensibility
  @Post('')
  async create(@Body() creationCommand: CreateClient) {
    // TODO inject a CommandHandlerService
    const result = await this.commandHandlerService.execute({
      type: 'CREATE_CLIENT',
      payload: creationCommand as unknown as IUpdateCommandFsa['payload'],
    });

    return result;
  }

  @Patch('test-setup')
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
