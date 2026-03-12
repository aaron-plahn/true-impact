import { PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import { TrueImpactError } from '../../../libs/data-types';
import { Client } from '../client.aggregate-root';

export interface IClientCommandRepository {
  exists(id: string): Promise<boolean>;

  fetchById(id: string): Promise<Client | null>; // Maybe<T>

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
