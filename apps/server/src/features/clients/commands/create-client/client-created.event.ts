import { plainToInstance } from 'class-transformer';
import { FullName, FullNameDto } from '../../../../common/full-name';
import {
  EnumeratedType,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  TrueImpactDataExample,
} from '../../../../libs/data-types';
import {
  ClientCompositeIdentifier,
  ClientCompositeIdentifierValuedProp,
} from '../../client.composite-identifier';

export class ClientCreatedPayload {
  @ClientCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: ClientCompositeIdentifier;

  @NestedDataType(() => FullNameDto, {
    label: 'full name',
    description: `the client's full name as a single piece of text`,
  })
  fullName: FullNameDto;

  @NonNegativeInteger({
    label: 'date of birth',
    description: `the user's date of birth`,
  })
  dateOfBirth: string; // we persist an ISO date string

  @EnumeratedType(
    {},
    {
      label: 'is Indigenous',
      description: `Was the user known to be Indigenous at the time of first entry into the system?`,
    },
  )
  isIndigenous?: 'Yes' | 'No' | 'Unknown';

  @NonEmptyString({
    label: 'community ID',
    description: `identifies the community the client belongs too`,
    isOptional: true,
  })
  communityId?: string;
}

export const CLIENT_CREATED = 'CLIENT_CREATED';

@TrueImpactDataExample<ClientCreated>({
  example: {
    type: 'CLIENT_CREATED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'client',
        id: '333',
      },
      fullName: FullName.fromString('Raymond Doe') as FullName,
      // TODO can we ensure this is being converted to ISO before persisting?
      dateOfBirth: '2005-12-20',
    },
  },
})
export class ClientCreated {
  readonly type = CLIENT_CREATED;

  readonly payload: ClientCreatedPayload;

  constructor({ payload }: { payload: ClientCreatedPayload }) {
    this.payload = plainToInstance(ClientCreatedPayload, payload);

    // TODO We should validate the schema before persisting.
  }

  /**
   * Use this factory method to build an event record from a persisted document (after applying the thin mapping layer)
   */
  public static fromPersistenceDto({
    payload,
  }: {
    payload: ClientCreatedPayload;
  }) {
    return new ClientCreated({ payload });
  }
}
