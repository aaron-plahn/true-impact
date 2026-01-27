import { Entity } from '@true-impact/data-types';

export interface IBaseCommandRepository<T extends Entity = Entity> {
  fetchById(id: string): Promise<T> | null; // Maybe<T>

  fetchMany(): Promise<T[]>;

  // Error || Ack
  create(instance: T): Promise<void>;

  // Error[] ?
  createMany(instances: T[]): Promise<void>;
}
