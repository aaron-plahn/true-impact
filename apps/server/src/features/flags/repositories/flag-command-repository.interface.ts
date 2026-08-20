import { PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import { TrueImpactError } from '../../../libs/data-types';
import { Flag } from '../models';

export interface IFlagCommandRepository {
  exists(id: string): Promise<boolean>;

  fetchById(id: string): Promise<Flag | null>; // Maybe<T>

  fetchByLabel(label: string): Promise<Flag | null>; // Maybe<T>. Is there also a returned error possiblity?

  fetchMany(): Promise<Flag[]>;

  // Error || Ack
  create(instance: Flag): Promise<PersistenceAcknowledgement | TrueImpactError>;

  // Error[] ?
  createMany(instances: Flag[]): Promise<void>;

  update(instance: Flag): Promise<PersistenceAcknowledgement | TrueImpactError>;
}
