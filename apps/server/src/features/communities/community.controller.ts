import { AdminRbacAuthGuard } from '../../auth/guards';
import type { ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import {
  BadUserInputFilter,
  Body,
  Controller,
  DetailQueryEndpoint,
  DynamicSelectorResponse,
  DynamicSelectorSearchBody,
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

    /**
     * Ideally, we would filter in the DB. But we will never have > ~10 communities
     * in a single DB, so there's really no performance to be gained.
     *
     * Also, we should eagerly process the multilingual text and include
     * - bilingual text
     * - primary item
     * - secondary item
     * based on the language code in the tenant's config
     */
    const allCommunities = await this.communityQueryService.fetchMany();

    const results = allCommunities.flatMap((c) => {
      const searchForOriginalItem = Object.entries(c.name.items).find(
        ([_originalLanguageCode, item]) => 'original' in item,
      );

      if (!searchForOriginalItem) {
        return [];
      }

      const [originalLanguageCode, itemForOriginalLanguage] =
        searchForOriginalItem;

      const originalText = itemForOriginalLanguage['original']?.text;

      if (!originalText) {
        return [];
      }

      const searchForTranslationItem = Object.entries(c.name.items).find(
        ([languageCode, item]) =>
          languageCode !== originalLanguageCode && 'free translation' in item,
      );

      const translationText =
        searchForTranslationItem?.[1]?.['free translation']?.text;

      const bilingualText = translationText
        ? `${originalText} (${translationText})`
        : originalText;

      if (!searchText) {
        return [
          {
            id: c.id,
            label: bilingualText,
          },
        ];
      }

      const matchesOriginalText =
        originalText && originalText.toLowerCase().includes(searchText);

      const matchesTranslationText =
        translationText && translationText.toLowerCase().includes(searchText);

      if (matchesOriginalText || matchesTranslationText) {
        return [
          {
            id: c.id,
            label: bilingualText,
          },
        ];
      }

      return [];
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
