import { FullName, FullNameDto } from '../../../common/full-name';
import { CommunityViewModelClientDto } from '../../../features/communities/queries';
import { FlagViewModelClientDto } from '../../../features/flags/queries';
import {
  deepConvertMapToObject,
  YesNoOrUnknown,
} from '../../../libs/data-types';
import { Client } from '../client.aggregate-root';

export class ClientViewModelClientDto {
  id: string;

  dateOfBirth: string;

  revision: string;

  fullName: FullNameDto;

  isIndigenous: YesNoOrUnknown;

  community?: CommunityViewModelClientDto;

  flags: Record<string, FlagViewModelClientDto>;
}

export class ClientViewModel {
  id: string;

  revision: string;

  fullName: FullName;

  isIndigenous: YesNoOrUnknown;

  community?: CommunityViewModelClientDto;

  flags: Map<string, FlagViewModelClientDto>;

  dateOfBirth: string;

  constructor({
    id,
    revision,
    fullName,
    isIndigenous,
    community,
    flags,
  }: {
    id: string;
    dateOfBirth: string;
    revision: string;
    fullName: FullName;
    isIndigenous: YesNoOrUnknown;
    community?: CommunityViewModelClientDto;
    flags: Map<string, FlagViewModelClientDto>;
  }) {
    this.id = id;

    this.revision = revision;

    this.fullName = fullName;

    this.isIndigenous = isIndigenous;

    this.community = community;

    this.flags = flags;
  }

  toClientDto(): ClientViewModelClientDto {
    return {
      id: this.id,
      dateOfBirth: this.dateOfBirth,
      revision: this.revision,
      fullName: this.fullName.toDto(),
      isIndigenous: this.isIndigenous,
      community: this.community,
      flags: deepConvertMapToObject(this.flags),
    };
  }

  //   TODO Support flags on client views
  //   flags: Map<string, FlagViewModel>;

  static fromDomainModel(
    client: Client,
    context: {
      communities: Map<string, CommunityViewModelClientDto>;
      flags: Map<string, FlagViewModelClientDto>;
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

    return new ClientViewModel({
      id,
      revision: revision.toString(),
      dateOfBirth,
      fullName: FullName.fromDto(fullName),
      isIndigenous,
      community,
      flags: flagsById,
    });
  }
}
