import {
  BadUserInputFilter,
  Controller,
  DetailQueryEndpoint,
  Param,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';
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
  async fetchById(@Param('id') id: string) {
    return this.clientsService.fetchById(id);
  }
}
