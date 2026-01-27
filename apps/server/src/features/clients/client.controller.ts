import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { QueryResponseInterceptor } from '../../common/framework';
import {
  BadUserInputFilter,
  ResourceNotFoundFilter,
} from '../../common/framework/exceptions';
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

  @Get('/:id')
  async fetchById(@Param('id') id: string) {
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
