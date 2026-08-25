import { SurveyResponseQueryService } from 'src/features/survey/survey-completion/queries';
import { SurveyResponseRecordViewModelClientDto } from 'src/features/survey/survey-completion/queries/survey-response-record.view-model';
import {
  CommunityQueryService,
  CommunityViewModelClientDto,
} from '../../../features/communities/queries';
import {
  FlagQueryService,
  FlagViewModelClientDto,
} from '../../../features/flags/queries';
import { TrueImpactError } from '../../../libs/data-types';
import { Inject } from '../../../libs/framework';
import { Client } from '../client.aggregate-root';
import { CLIENT_AGGREGATE_TYPE } from '../client.composite-identifier';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../constants';
import { ClientViewModel, ClientViewModelClientDto } from '../queries';
import type { IClientCommandRepository } from '../repositories';

export class ClientQueryService {
  // For now, we project off the domain (command) models. In the future, we may have a query DB separate from our operational DB.
  constructor(
    @Inject(CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: IClientCommandRepository,
    private readonly communityQueryService: CommunityQueryService,
    private readonly flagQueryService: FlagQueryService,
    private readonly surveyResponseQueryService: SurveyResponseQueryService,
  ) {}

  // TODO We may want to inject the user context for permissions.
  async fetchById(
    id: string,
  ): Promise<ClientViewModelClientDto | null | TrueImpactError> {
    const domainModelSearchResult = await this.repository.fetchById(id);

    if (!domainModelSearchResult) {
      return null;
    }

    const communitiesById = new Map<string, CommunityViewModelClientDto>();

    const { communityId } = domainModelSearchResult;

    if (communityId) {
      const communitySearchResult =
        await this.communityQueryService.fetchById(communityId);

      if (communitySearchResult) {
        communitiesById.set(communityId, communitySearchResult);
      }
    }

    const flagsById = new Map<string, FlagViewModelClientDto>();

    const flags = await this.flagQueryService.fetchMany();

    if (flags instanceof TrueImpactError) {
      return flags;
    }

    flags.forEach((f) => {
      flagsById.set(f.id, f);
    });

    const reportsForClient =
      await this.surveyResponseQueryService.forParticipant({
        type: CLIENT_AGGREGATE_TYPE,
        id,
      });

    if (reportsForClient instanceof Error) {
      return new TrueImpactError(
        `Failed to fetch client [${id}]. Failed to fetch survey responses for this client.`,
        [reportsForClient],
      );
    }

    const reportsByClientId = new Map<
      string,
      SurveyResponseRecordViewModelClientDto[]
    >().set(
      id,
      reportsForClient.map((r) => r.toClientDto()),
    );

    const view = this.buildView(domainModelSearchResult, {
      communities: communitiesById,
      flags: flagsById,
      reportsByClientId,
    });

    return view;
  }

  // TODO inject `user` and user filter \ pagination options
  async fetchMany(): Promise<ClientViewModelClientDto[] | TrueImpactError> {
    const domainModels = await this.repository.fetchMany();

    const communitiesById = new Map<string, CommunityViewModelClientDto>();

    const communities = await this.communityQueryService.fetchMany();

    communities.forEach((c) => {
      communitiesById.set(c.id, c);
    });

    const flagsById = new Map<string, FlagViewModelClientDto>();

    const flags = await this.flagQueryService.fetchMany();

    if (flags instanceof TrueImpactError) {
      return flags;
    }

    flags.forEach((f) => {
      flagsById.set(f.id, f);
    });

    const viewModels = domainModels.map((dm) =>
      this.buildView(dm, {
        communities: communitiesById,
        flags: flagsById,
        // We don't currently need reports in client index views.
        reportsByClientId: new Map(),
      }),
    );

    return viewModels;
  }

  private buildView(
    domainModel: Client,
    context: {
      communities: Map<string, CommunityViewModelClientDto>;
      flags: Map<string, FlagViewModelClientDto>;
      reportsByClientId: Map<string, SurveyResponseRecordViewModelClientDto[]>;
    },
  ): ClientViewModelClientDto {
    const result = ClientViewModel.fromDomainModel(domainModel, context);

    return result.toClientDto();
  }
}
