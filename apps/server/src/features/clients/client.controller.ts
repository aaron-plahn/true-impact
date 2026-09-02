import { AuthenticatedUserGuard, RbacAuthGuard } from 'src/auth/guards';
import type { CommandResult, ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService } from '../../libs/cqrs-es';

import {
  buildTestInstance,
  convertToOpenApiSchema,
  getDataSchemaFromClassCtor,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import {
  ApiOkResponse,
  BadUserInputFilter,
  Body,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  IndexQueryEndpoint,
  OnModuleInit,
  Post,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  TestSetupEndpoint,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '../../libs/framework';
import { ClientViewModelClientDto } from './queries';
import { ClientQueryService } from './services/client-query.service';

const schema = convertToOpenApiSchema(
  getDataSchemaFromClassCtor(ClientViewModelClientDto),
);

const example = buildTestInstance(ClientViewModelClientDto);

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('clients')
export class ClientController implements OnModuleInit {
  constructor(
    private readonly clientsService: ClientQueryService,
    private readonly commandHandlerService: CommandHandlerService,
  ) {}

  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @DetailQueryEndpoint()
  @ApiOkResponse({
    schema,
    example,
  })
  async fetchById(@IdParam() id: string) {
    const result = await this.clientsService.fetchById(id);

    return result;
  }

  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @IndexQueryEndpoint()
  @ApiOkResponse({
    isArray: true,
    schema,
    example,
  })
  async fetchMany() {
    // TODO We should join these eagerly in a dedicated query DB
    const clients = await this.clientsService.fetchMany();

    return clients;
  }

  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @Post('commands')
  async executeCommand(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }

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
    await this.clientsService.repository.clear();

    return 'OK';
  }

  onModuleInit() {
    this.commandHandlerService.buildApiDocs(ClientController);
  }
}
