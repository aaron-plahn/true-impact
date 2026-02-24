import { TrueImpactError, ViewModel } from '../../../libs/data-types';

export interface IBaseQueryRepository<T extends ViewModel = ViewModel> {
  fetchById(id: string): Promise<T> | null; // Maybe<T>

  fetchMany(): Promise<T[]>;

  // Error || Ack
  create(instance: T): Promise<string | TrueImpactError>;

  // Error[] ?
  createMany(instances: T[]): Promise<void>;
}
