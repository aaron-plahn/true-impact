import {
  Controller,
  Get,
  Param,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { QueryResponseInterceptor } from '../../common/framework';
import { ResourceNotFoundFilter } from '../../common/framework/exceptions';
import { ClientQueryService } from './services/client-query.service';

@UseFilters(ResourceNotFoundFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('clients')
export class ClientController {
  constructor(private readonly clientsService: ClientQueryService) {}

  @Get('/:id')
  async fetchById(@Param('id') id: string) {
    return this.clientsService.fetchById(id);
  }

  // TODO We want a dedicated /commands endpoint for extensibility
  async create() {}
}
