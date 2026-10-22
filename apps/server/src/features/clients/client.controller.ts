import { compileJsQuery, LogicalOperator } from 'src/libs/query-language';
import { IndexTable } from 'src/libs/server-driven-ui';
import { AdminRbacAuthGuard } from '../../auth/guards';
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
  OnModuleInit,
  Post,
  QueryOptions,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  TestSetupEndpoint,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '../../libs/framework';
import { CLIENT_AGGREGATE_TYPE } from './client.composite-identifier';
import { ClientViewModelClientDto } from './queries';
import { ClientQueryService } from './services/client-query.service';

const schema = convertToOpenApiSchema(
  getDataSchemaFromClassCtor(ClientViewModelClientDto),
);

const example = buildTestInstance(ClientViewModelClientDto);

const PAGE_SIZES = [5, 10, 50, 100];

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('clients')
export class ClientController implements OnModuleInit {
  constructor(
    private readonly clientsService: ClientQueryService,
    private readonly commandHandlerService: CommandHandlerService,
  ) {}

  @UseGuards(AdminRbacAuthGuard)
  @DetailQueryEndpoint()
  @ApiOkResponse({
    schema,
    example,
  })
  async fetchById(@IdParam() id: string) {
    const result = await this.clientsService.fetchById(id);

    return result;
  }

  @UseGuards(AdminRbacAuthGuard)
  // @IndexQueryEndpoint()
  @Post('')
  @ApiOkResponse({
    isArray: true,
    schema,
    example,
  })
  async fetchMany(
    // TODO validate the type of the query prior to processing
    // TODO limit the depth of a query
    @Body()
    { filter, pagination }: QueryOptions,
  ): Promise<IndexTable<ClientViewModelClientDto> | TrueImpactError> {
    // TODO pass the filter to the query service
    const clients = await this.clientsService.fetchMany();

    if (clients instanceof Error) {
      return clients;
    }

    // TODO We need to filter and paginate in the database
    const filterToUse = filter
      ? compileJsQuery<ClientViewModelClientDto>(filter)
      : () => true;

    const filteredClients = clients.filter(filterToUse);

    const paginationToUse = pagination
      ? pagination
      : // TODO We should set these defaults in middleware so we don't have to do this in every controller
        {
          // TODO no magic constants
          page: 1,
          pageSize: 10,
        };

    const { page, pageSize } = paginationToUse;

    // the page is human readable (indexed starting at 1)
    const pageIndex = page - 1;

    const startIndexInclusive = pageIndex * pageSize; // e.g., 10 per page start on page 3 -> array index 30; 5 for page, start at 0, array index 0;

    const endIndexExclusive = startIndexInclusive + pageSize; // e.g. page 2, page size 10 -> indices 10-19

    const currentPageOfClients = filteredClients.slice(
      startIndexInclusive,
      endIndexExclusive,
    );

    // division by 0 scares me almost as much as `Infinity` showing up on the screen
    const totalNumberOfPages =
      pageSize === 0 ? 1 : Math.floor(clients.length / pageSize);

    const result: IndexTable<ClientViewModelClientDto> = {
      layout: {
        isSearchable: true,
        columns: [
          // hidden
          // {
          //   key: 'id',
          //   label: '',
          // },
          {
            key: 'isIndigenous',
            label: 'Is Indigenous?',
            type: 'TEXT',
            search: {
              type: 'SELECT',
              operator: LogicalOperator.EQUALS,
              options: [
                {
                  value: 'Yes',
                  label: 'yes',
                },
                {
                  value: 'No',
                  label: 'no',
                },
                {
                  value: 'Unknown',
                  label: 'unknown',
                },
              ],
            },
          },
        ],
      },
      rows: currentPageOfClients,
      navigationPanel: {
        currentPage: page,
        totalNumberOfPages, // should this be a string label?
        nextPage: (page + 1) % totalNumberOfPages, // e.g., if you are on page 20 / 20, (20+1)%20 -> 1
        previousPage: page === 0 ? totalNumberOfPages : page - 1,
        pageSize: pageSize,
        // no point of changing to the current page size
        availablePageSizes: PAGE_SIZES.filter((ps) => ps !== pageSize),
        totalNumberOfResults: clients.length,
      },
    };

    return result;
  }

  @UseGuards(AdminRbacAuthGuard)
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
    await this.clientsService.repository.clear(CLIENT_AGGREGATE_TYPE);

    return 'OK';
  }

  onModuleInit() {
    this.commandHandlerService.buildApiDocs(ClientController);
  }
}
