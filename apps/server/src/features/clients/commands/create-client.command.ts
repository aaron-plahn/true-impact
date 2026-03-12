import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';

@TrueImpactDataExample<CreateClient>({
  example: {
    firstName: 'Jane',
    // middle name?
    lastName: 'Jones',

    dateOfBirth: '2010-11-04',
    isIndigenous: 'Yes',
    // TODO validate this in the command handler against known communities
    communityId: '55506',
  },
})
export class CreateClient {
  static readonly type = 'CREATE_CLIENT';

  /**
   * We don't want the client to have to generate an ID before sending a request. If we choose to persist
   * commands, we can append the generated ID in the event of success. We want to leave it open whether to use an ID generation service
   * or allow the database to generate IDs.
   *
   * We may want to optionally allow the specification of an existing `fileNumber`, though. Consider this in the future.
   */
  // aggregateComposteIdentifier: ClientCompositeIdentifier;

  @NonEmptyString({
    label: 'first name',
    description: `the new client's first name`,
  })
  firstName: string;

  @NonEmptyString({
    label: 'last name',
    description: `the new client's last name`,
  })
  lastName: string;

  @NonEmptyString({
    label: 'date of birth',
    description: `the new client's date of birth`,
  })
  dateOfBirth: string; // parse to Date or put date object on payload

  // TODO @Enum
  isIndigenous: 'Yes' | 'No' | 'Unknown';

  @NonEmptyString({
    label: 'community ID',
    description: `system identifier for this client's community`,
    isOptional: true,
  })
  communityId?: string;
}
