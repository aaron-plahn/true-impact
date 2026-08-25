import { SurveyResponseRecordViewModelClientDto } from 'src/features/survey/survey-completion/queries/survey-response-record.view-model';
import { FullName, FullNameDto } from '../../../common/full-name';
import { CommunityViewModelClientDto } from '../../../features/communities/queries';
import { FlagViewModelClientDto } from '../../../features/flags/queries';
import type { YesNoOrUnknown } from '../../../libs/data-types';
import {
  deepConvertMapToObject,
  EnumeratedType,
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import { LookupTable } from '../../../libs/data-types/schema-management/decorators/lookup-table.decorator';
import { Client } from '../client.aggregate-root';

@TrueImpactDataExample<ClientViewModelClientDto>({
  example: {
    id: '1',
    dateOfBirth: '10-11-2012',
    revision: '7',
    fullName: {
      firstName: 'John',
      middleNames: ['Bob'],
      lastName: 'Deer',
    },
    isIndigenous: 'No',
    flagsById: {
      f123: {
        id: 'f123',
        revision: '7',
        label: 'friendly',
        description: 'is nice to others',
      },
    },
    surveyResponses: [],
  },
})
export class ClientViewModelClientDto {
  @NonEmptyString({
    label: 'ID',
    description: 'unique identifier for this client',
  })
  id: string;

  @NonEmptyString({
    label: 'date of birth',
    description: `the client's date of birth`,
  })
  dateOfBirth: string;

  @NonEmptyString({
    label: 'revision',
    description: 'tracks historical edits to this client',
  })
  revision: string;

  @NestedDataType(() => FullNameDto, {
    label: 'full name',
    description: `the client's full name`,
  })
  fullName: FullNameDto;

  @EnumeratedType(
    {
      Yes: 'Yes',
      No: 'No',
      Unknown: 'Unknown',
    },
    {
      label: 'is Indigenous',
      description: 'Is this client Idigenous (if known)?',
    },
  )
  isIndigenous: YesNoOrUnknown;

  @NestedDataType(() => CommunityViewModelClientDto, {
    label: 'community',
    description: 'the community to which the client is registered',
  })
  community?: CommunityViewModelClientDto;

  @LookupTable(() => FlagViewModelClientDto, {
    label: 'flags by ID',
    description:
      'a lookup table holding all flags that have been applied to this client',
  })
  flagsById: Record<string, FlagViewModelClientDto>;

  @NestedDataType(() => SurveyResponseRecordViewModelClientDto, {
    label: 'surveys completed',
    description: 'a list of all survey responses submitted by this client',
    isArray: true,
    isOptional: true, // i.e., can be empty
  })
  surveyResponses: SurveyResponseRecordViewModelClientDto[];
}

export class ClientViewModel {
  id: string;

  revision: string;

  fullName: FullName;

  isIndigenous: YesNoOrUnknown;

  community?: CommunityViewModelClientDto;

  flags: Map<string, FlagViewModelClientDto>;

  // these should be sorted by completion date (most recent first)
  surveyResponses: SurveyResponseRecordViewModelClientDto[];

  dateOfBirth: string;

  constructor({
    id,
    revision,
    fullName,
    isIndigenous,
    community,
    flags,
    surveyResponses,
  }: {
    id: string;
    dateOfBirth: string;
    revision: string;
    fullName: FullName;
    isIndigenous: YesNoOrUnknown;
    community?: CommunityViewModelClientDto;
    flags: Map<string, FlagViewModelClientDto>;
    surveyResponses: SurveyResponseRecordViewModelClientDto[];
  }) {
    this.id = id;

    this.revision = revision;

    this.fullName = fullName;

    this.isIndigenous = isIndigenous;

    this.community = community;

    this.flags = flags;

    this.surveyResponses = surveyResponses;
  }

  toClientDto(): ClientViewModelClientDto {
    return {
      id: this.id,
      dateOfBirth: this.dateOfBirth,
      revision: this.revision,
      fullName: this.fullName.toDto(),
      isIndigenous: this.isIndigenous,
      community: this.community,
      flagsById: deepConvertMapToObject(this.flags),
      surveyResponses: this.surveyResponses,
    };
  }

  static fromDomainModel(
    client: Client,
    context: {
      communities: Map<string, CommunityViewModelClientDto>;
      flags: Map<string, FlagViewModelClientDto>;
      // TODO rename this survey responses by client ID
      reportsByClientId: Map<string, SurveyResponseRecordViewModelClientDto[]>;
    },
  ) {
    const {
      id,
      revision,
      fullName,
      isIndigenous,
      communityId,
      dateOfBirth,
      flagIds,
    } = client;

    let community: CommunityViewModelClientDto | undefined;

    if (communityId && context.communities.has(communityId)) {
      community = context.communities.get(communityId);
    }

    const flagsById = new Map<string, FlagViewModelClientDto>();

    flagIds.forEach((flagId) => {
      if (context.flags.has(flagId)) {
        flagsById.set(
          flagId,
          context.flags.get(flagId) as FlagViewModelClientDto,
        );
      }
    });

    const surveyResponses = context.reportsByClientId.get(id) || [];

    return new ClientViewModel({
      id,
      revision: revision.toString(),
      dateOfBirth,
      fullName: FullName.fromDto(fullName),
      isIndigenous,
      community,
      flags: flagsById,
      surveyResponses,
    });
  }
}
