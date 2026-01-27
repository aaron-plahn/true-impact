import { Entity } from '@true-impact/data-types';
import { TrueImpactError } from '@true-impact/data-types/error-handling';

export interface IBaseCommandRepository<T extends Entity = Entity> {
  fetchById(id: string): Promise<T> | null; // Maybe<T>

  fetchMany(): Promise<T[]>;

  // Error || Ack
  create(instance: T): Promise<string | TrueImpactError>;

  // Error[] ?
  createMany(instances: T[]): Promise<void>;
}
