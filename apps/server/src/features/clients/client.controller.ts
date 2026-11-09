// TODO move this to `framework`
import {
  AndQueryFilterCondition,
  compileJsQuery,
  ConditionalBlockType,
  LogicalOperator,
  SimpleQueryFilterCondition,
} from 'src/libs/query-language';
import { IndexTable, TableLayout } from 'src/libs/server-driven-ui';
import { AdminRbacAuthGuard } from '../../auth/guards';
import type { CommandResult, ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService } from '../../libs/cqrs-es';
import {
  buildTestInstance,
  convertToOpenApiSchema,
  getDataSchemaFromClassCtor,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import {
  ApiBody,
  ApiOkResponse,
  BadUserInputFilter,
  Body,
  Controller,
  DetailQueryEndpoint,
  Get,
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
import { ClientIndexListRowViewDto, ClientViewModelClientDto } from './queries';
import { ClientQueryService } from './services/client-query.service';

const schema = convertToOpenApiSchema(
  getDataSchemaFromClassCtor(ClientViewModelClientDto),
);

const example = buildTestInstance(ClientViewModelClientDto);

const queryOptionsExample = buildTestInstance(QueryOptions);

const DEFAULT_PAGE_SIZE = 10;

const DEFAULT_PAGE = 1;

// TODO Move this to a shared directory unless we intend to make the options dynamic (based on current results size)
const PAGE_SIZES = [5, DEFAULT_PAGE_SIZE, 50, 100];

const validateFieldReferencesInFilter = (
  filter: AndQueryFilterCondition | SimpleQueryFilterCondition,
  errors: TrueImpactError[] = [],
): TrueImpactError[] => {
  const { type: filterBlockType } = filter;
  if (filterBlockType === ConditionalBlockType.SIMPLE) {
    if (filter.field.includes('.')) {
      errors.push(
        new TrueImpactError(
          `Searching nested fields [${filter.field}] is not yet supported.`,
        ),
      );
    }

    return errors;
  }

  if (filterBlockType === ConditionalBlockType.AND) {
    filter.conditions
      .flatMap((condition) => validateFieldReferencesInFilter(condition))
      .forEach((e) => errors.push(e));

    return errors;
  }

  const exhaustiveCheck: never = filterBlockType;

  errors.push(
    new TrueImpactError(
      `Failed to compile filter condition block of unknown type [${exhaustiveCheck as string}]`,
    ),
  );

  return errors;
};

const layout: TableLayout<keyof ClientIndexListRowViewDto> = {
  isSearchable: true, // i.e. one of the columns has a `search` configuration
  columns: [
    // hidden
    // {
    //   key: 'id',
    //   label: '',
    // },
    {
      key: 'link',
      label: 'View',
      type: 'LINK',
      // not searchable
    },
    {
      key: 'firstName',
      label: 'First Name',
      type: 'TEXT',
      search: {
        type: 'TEXT',
        operator: LogicalOperator.TEXT_INCLUDES,
      },
    },
    // TODO add search scenario test cases for this property
    {
      key: 'lastName',
      label: 'Last Name',
      type: 'TEXT',
      search: {
        type: 'TEXT',
        operator: LogicalOperator.TEXT_INCLUDES,
      },
    },
    {
      key: 'community',
      label: 'Community',
      type: 'TEXT',
      search: {
        type: 'TEXT',
        operator: LogicalOperator.TEXT_INCLUDES,
      },
    },
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
};

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('clients')
export class ClientController implements OnModuleInit {
  constructor(
    private readonly clientsService: ClientQueryService,
    private readonly commandHandlerService: CommandHandlerService,
  ) {}

  /**
   * We use a REST inspired approach here to return the table structure prior to the first request
   * for data.
   *
   * Note that we would prefer to make this an `OPTIONS` endpoint to stay closer to REST. We avoid this
   * because for most endpoints we'd like to let NestJS handle the corresponding `OPTIONS` and corresponding
   * CORS issues. We don't want additional complex middleware to handle the exceptional cases.
   * This is a bit of a leaky abstraction.
   */
  @Get('index-table-options')
  async fetchManyOptions(): Promise<
    TableLayout<keyof ClientIndexListRowViewDto>
  > {
    return Promise.resolve(layout);
  }

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
  @ApiBody({
    examples: {
      'pagination and an and filter': {
        value: queryOptionsExample,
      },
    },
    schema: convertToOpenApiSchema(getDataSchemaFromClassCtor(QueryOptions)),
  })
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
  ): Promise<IndexTable<ClientIndexListRowViewDto> | TrueImpactError> {
    // TODO pass the filter to the query service
    const clients = await this.clientsService.fetchMany();

    if (clients instanceof Error) {
      return clients;
    }

    if (filter) {
      const filterValidationResult = validateFieldReferencesInFilter(filter);

      if (filterValidationResult.length > 0) {
        return new TrueImpactBadUserInputError([
          new TrueImpactError(`Invalid filter provided by user.`),
          ...filterValidationResult,
        ]);
      }
    }

    // TODO We need to filter and paginate in the database
    const filterToUse = filter
      ? compileJsQuery<ClientIndexListRowViewDto>(filter)
      : () => true;

    const filteredClients = clients
      .sort((a, b) => a.createdAt - b.createdAt)
      .filter(filterToUse);

    const paginationToUse = pagination
      ? pagination
      : // TODO We should set these defaults in middleware so we don't have to do this in every controller
        {
          page: DEFAULT_PAGE,
          pageSize: DEFAULT_PAGE_SIZE,
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
      pageSize === 0 ? 1 : Math.ceil(clients.length / pageSize);

    const result: IndexTable<ClientIndexListRowViewDto> = {
      layout,
      rows: currentPageOfClients,
      navigationPanel: {
        currentPage: page,
        totalNumberOfPages, // should this be a string label?
        nextPage: (page % totalNumberOfPages) + 1, // e.g., if you are on page 20 / 20, (20 % 20) + 1 -> 1, on page 19, (19 % 20) + 1 = 20
        previousPage: page === 1 ? totalNumberOfPages : page - 1,
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

    // TODO remove this
    if (result instanceof Error) {
      console.log({
        oooopssssssssssssssssssssSSS: result.toString(),
      });
    }

    // TODO ensure the error {message} is returned properly on the response body, right now we get `{ innerErrors: [] }`
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
