import {
  BadUserInputFilter,
  Body,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  Post,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';
import { CreateClient } from './commands/create-client.command';
import { CreateClientCommandHandler } from './commands/create-client.command-handler';
import { ClientQueryService } from './services/client-query.service';

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('clients')
export class ClientController {
  constructor(
    private readonly clientsService: ClientQueryService,
    private readonly creationCommandHandler: CreateClientCommandHandler,
  ) {}

  @DetailQueryEndpoint()
  async fetchById(@IdParam() id: string) {
    return this.clientsService.fetchById(id);
  }

  // TODO We want a dedicated /commands endpoint for extensibility
  @Post('')
  async create(@Body() creationCommand: CreateClient) {
    // TODO inject a CommandHandlerService
    const result = await this.creationCommandHandler.execute(creationCommand);

    return result;
  }
}
