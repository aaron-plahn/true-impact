import { AdminRbacAuthGuard } from '../../auth/guards';
import type { ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../libs/cqrs-es';
import {
  NonEmptyString,
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
  OnModuleInit,
  Post,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  TestSetupEndpoint,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '../../libs/framework';
import { COMMUNITY_AGGREGATE_TYPE } from './constants';
import { CommunityQueryService, CommunityViewModelClientDto } from './queries';

class DynamicSelectorSearchBody {
  @NonEmptyString({
    label: 'search text',
    description:
      'text to search for across all searchable properties for this resource',
  })
  searchText: string;
}

class LabelAndId {
  id: string;
  label: string;
}

class DynamicSelectorResponse {
  results: LabelAndId[];
}

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('communities')
export class CommunityController implements OnModuleInit {
  constructor(
    private readonly commandHandlerService: CommandHandlerService,
    private readonly communityQueryService: CommunityQueryService,
  ) {}

  // TODO @CommandExecutionEndpoint
  // TODO add a separate command controller
  @UseGuards(AdminRbacAuthGuard)
  @Post('commands')
  async executeCommand(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }

  @Post('select')
  @UseGuards(AdminRbacAuthGuard)
  async dynamicSelector(
    @Body()
    body?: DynamicSelectorSearchBody,
  ): Promise<DynamicSelectorResponse> {
    const searchText = body?.searchText;

    console.log({
      searchTextZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ: searchText,
      body,
    });

    /**
     * Ideally, we would filter in the DB. But we will never have > ~10 communities
     * in a single DB, so there's really no performance to be gained.
     */
    const result = await this.communityQueryService.fetchMany();

    const matchingCommunitites = result.filter((c) => {
      if (!searchText) return true;

      return JSON.stringify(c.name)
        .toLowerCase()
        .includes(searchText.toLowerCase());
    });

    const results = matchingCommunitites.map((c) => {
      const english = c.name.items['en']['original']?.text;

      const translationItems = Array.from(Object.entries(c.name.items)).find(
        ([languageCode, _translations]) => languageCode !== 'en',
      );

      const translation = translationItems?.[1]?.['original']?.text;

      /**
       * TODO we should assume nothing about the existence of text for a specific language.
       * The view model should persist the `original` and `translation` in an easily accessible place
       * and maybe a `bilingual` representation like what we build below.
       */
      const label = translation
        ? `${translation} (${english})`
        : (english as string);

      return {
        id: c.id,
        label,
      };
    });

    return { results };
  }

  @UseGuards(AdminRbacAuthGuard)
  @DetailQueryEndpoint()
  async fetchById(
    @IdParam() id: string,
  ): Promise<CommunityViewModelClientDto | TrueImpactError | null> {
    const result = await this.communityQueryService.fetchById(id);

    return result;
  }

  @UseGuards(AdminRbacAuthGuard)
  @IndexQueryEndpoint()
  async fetchMany(): Promise<CommunityViewModelClientDto[] | TrueImpactError> {
    const result = await this.communityQueryService.fetchMany();

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
    await this.communityQueryService.commandRepository.clear(
      COMMUNITY_AGGREGATE_TYPE,
    );

    return 'OK';
  }

  onModuleInit() {
    this.commandHandlerService.buildApiDocs(CommunityController);
  }
}
