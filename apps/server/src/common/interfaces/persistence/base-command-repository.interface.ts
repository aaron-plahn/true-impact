import { Entity, TrueImpactError } from 'src/libs';

export interface IBaseCommandRepository<T extends Entity = Entity> {
  fetchById(id: string): Promise<T> | null; // Maybe<T>

  fetchMany(): Promise<T[]>;

  // Error || Ack
  create(instance: T): Promise<string | TrueImpactError>;

  // Error[] ?
  createMany(instances: T[]): Promise<void>;
}
