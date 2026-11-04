import { FullName, FullNameDto } from '../../../common/full-name';
import { CommunityViewModelClientDto } from '../../../features/communities/queries';
import { FlagViewModelClientDto } from '../../../features/flags/queries';
import { SurveyResponseRecordViewModelClientDto } from '../../../features/survey/survey-completion/queries/survey-response-record.view-model';
import type { YesNoOrUnknown } from '../../../libs/data-types';
import {
  deepConvertMapToObject,
  EnumeratedType,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import { LookupTable } from '../../../libs/data-types/schema-management/decorators/lookup-table.decorator';
import { Client } from '../client.aggregate-root';

export class ClientIndexListRowViewDto {
  // this is meant to be a "hidden" field
  @NonEmptyString({
    label: 'ID',
    description: 'unique identifier for the client represented by this row',
  })
  id: string;

  // this should be an object with a route, label, and tooltip
  @NonEmptyString({
    label: 'link',
    description: 'relative link to the detail view for this client',
  })
  link: string;

  @NonNegativeInteger({
    label: 'created at',
    description:
      'UNIX timestamp representing the time at which this client was added to the system',
  })
  createdAt: number;

  @EnumeratedType(
    {
      Yes: 'yes',
      No: 'no',
      Unknown: 'unknown',
    },
    {
      label: 'is Indigenous?',
      description: 'Is this client Indigenous (if known)?',
    },
  )
  isIndigenous: YesNoOrUnknown;

  // should this be a link?
  @NonEmptyString({
    label: 'community',
    description:
      'the Indigenous community to which this client is registered (if known and applicable)',
    isOptional: true,
  })
  community?: string;

  @NonEmptyString({
    label: 'First Name',
    description: `the client's first name`,
  })
  firstName: string;

  @NonEmptyString({
    label: 'Middle Initials',
    description: `the client's middle initials (if applicable), useful for distinguishing clients with the same first and last name`,
  })
  middleInitials?: string;

  @NonEmptyString({
    label: 'Last Name',
    description: `the client's last name`,
  })
  lastName: string;
}

@TrueImpactDataExample<ClientViewModelClientDto>({
  example: {
    id: '1',
    dateOfBirth: '10-11-2012',
    createdAt: 1793737061316,
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

  @NonNegativeInteger({
    label: 'created at',
    description:
      'UNIX timestamp for the date this client was first added to the database',
  })
  createdAt: number;

  @NestedDataType(() => FullNameDto, {
    label: 'full name',
    description: `the client's full name`,
  })
  // TODO we want to have first name, last name, and middle initials separately
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

  createdAt: number;

  // modifiedAt

  fullName: FullName;

  isIndigenous: YesNoOrUnknown;

  community?: CommunityViewModelClientDto;

  flags: Map<string, FlagViewModelClientDto>;

  // these are sorted by completion date (most recent first)
  surveyResponses: SurveyResponseRecordViewModelClientDto[];

  dateOfBirth: string;

  constructor({
    id,
    revision,
    createdAt,
    fullName,
    isIndigenous,
    community,
    flags,
    surveyResponses,
  }: {
    id: string;
    createdAt: number;
    dateOfBirth: string;
    revision: string;
    fullName: FullName;
    isIndigenous: YesNoOrUnknown;
    community?: CommunityViewModelClientDto;
    flags: Map<string, FlagViewModelClientDto>;
    surveyResponses: SurveyResponseRecordViewModelClientDto[];
  }) {
    this.id = id;

    this.createdAt = createdAt;

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
      createdAt: this.createdAt,
      dateOfBirth: this.dateOfBirth,
      revision: this.revision,
      fullName: this.fullName.toDto(),
      isIndigenous: this.isIndigenous,
      community: this.community,
      flagsById: deepConvertMapToObject(this.flags),
      surveyResponses: this.surveyResponses,
    };
  }

  toIndexTableRow(): ClientIndexListRowViewDto {
    return {
      id: this.id,
      link: `clients/${this.id}`,
      createdAt: this.createdAt,
      isIndigenous: this.isIndigenous,
      firstName: this.fullName.firstName,
      /**
       * While not that important a use case, this is interesting from a technical point of view in that
       * we may want to allow search of the underlying data independent of the rendered text. So we probably
       * want to search full middle names, but only show initials. We don't want to match a generated ".". We
       * might want to match a minimum number of middle names, such as "length(middleNames)> 0" or "length(middleNames) === 1".
       */
      middleInitials:
        this.fullName.middleNames.length > 0
          ? this.fullName.middleNames.join('.')
          : // '-' ?
            '',
      lastName: this.fullName.lastName,
    };
  }

  static fromDomainModel(
    client: Client,
    context: {
      communities: Map<string, CommunityViewModelClientDto>;
      flags: Map<string, FlagViewModelClientDto>;
      surveyResponsesByClientId: Map<
        string,
        SurveyResponseRecordViewModelClientDto[]
      >;
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
      eventHistory,
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

    const surveyResponses = (
      context.surveyResponsesByClientId.get(id) || []
    ).sort(
      (responseA, responseB) =>
        (responseA.submissionTime || 0) - (responseB.submissionTime || 0),
    );

    return new ClientViewModel({
      id,
      createdAt: (
        eventHistory[0] as unknown as { metadata: { dateEffective: number } }
      ).metadata.dateEffective,
      revision: revision.toString(),
      /**
       * In the long run, we probably want a `DateView` object.
       */
      dateOfBirth: dateOfBirth.toDateString(),
      fullName: FullName.fromDto(fullName),
      isIndigenous,
      community,
      flags: flagsById,
      surveyResponses,
    });
  }
}
