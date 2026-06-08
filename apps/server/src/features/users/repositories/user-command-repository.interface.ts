import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import { DeepPartial, TrueImpactError } from 'src/libs/data-types';
import { User } from '../user.aggregate-root';

export interface IUserCommandRepository {
  fetchById(id: string): Promise<User | null>;

  fetchMany(): Promise<User[] | TrueImpactError>;

  fetchByCredentials(credentials: {
    username: string;
    hashedPassword: string;
  }): Promise<User | null>;

  create(instance: User): Promise<PersistenceAcknowledgement | TrueImpactError>;

  //   TODO error? Acknowledgement?
  // note that this is currently only used for test setup
  createMany(instances: User[]): Promise<void>;

  /**
   * There is a fork in the road. If we decide to event-source users, then this
   * should simply append to the read-only event ledger. On the other hand, if we
   * persist via state-based mechanisms, we might want to expose a separate method for each
   * update (e.g. `grantRole`) to maintain a thin abstraction around the DB for complete control over
   * performance \ implementation details without the need for a query language.
   */
  update(
    intance: DeepPartial<User> & Pick<User, 'id'>,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;

  isEmpty(): Promise<boolean>;
}
