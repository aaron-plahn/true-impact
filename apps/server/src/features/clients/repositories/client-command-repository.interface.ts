import { PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import { TrueImpactError } from '../../../libs/data-types';
import { Client } from '../client.aggregate-root';

/**
 * We could just program to `EventSourcedCommandRepository<Client>` now. The only down side
 * is that we want to constrain our in-memory implementations. The best simplification
 * is to build in-memory repositories from a single `InMemoryEventRepository`.
 *
 * The in-memory repositories helped us get to alpha quickly. They may still
 * be useful in case we want to write integration tests that don't communicate
 * with a live db (for performance, for example).
 */
export interface IClientCommandRepository {
  exists(id: string): Promise<boolean>;

  fetchById(id: string): Promise<Client | TrueImpactError | null>; // Maybe<T>

  fetchMany(): Promise<Client[]>;

  // Error || Ack
  create(
    instance: Client,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;

  // Error[] ?
  createMany(instances: Client[]): Promise<void>;

  // DeepPartial<ClientPersistenceDto> ?
  update(
    instance: Client,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;
}
