import { TrueImpactDataExample } from '../../../libs/data-types';
import { ClientPersistenceDto } from '../client.aggregate-root';
import { CLIENT_AGGREGATE_TYPE } from '../client.composite-identifier';

@TrueImpactDataExample<ClientPersistenceDto>({
  example: {
    id: '123',
    fullName: {
      firstName: 'Jane',
      middleName: 'Bob',
      lastName: 'Jones',
    },
    dateOfBirth: '2010-11-04',
    isIndigenous: 'Yes',
    community: '55506',
  },
})
export class CreateClient {
  static readonly type = 'CREATE_CLIENT';

  // TODO remove this
  aggregateCompositeIdentifier: {
    type: typeof CLIENT_AGGREGATE_TYPE;
    id: string;
  };

  /**
   * We don't want the client to have to generate an ID before sending a request. If we choose to persist
   * commands, we can append the generated ID in the event of success. We want to leave it open whether to use an ID generation service
   * or allow the database to generate IDs.
   *
   * We may want to optionally allow the specification of an existing `fileNumber`, though. Consider this in the future.
   */
  // aggregateComposteIdentifier: ClientCompositeIdentifier;

  firstName: string;

  lastName: string;

  dateOfBirth: string; // parse to Date

  isIndigenous: 'Yes' | 'No' | 'Unknown';

  community?: string;
}
