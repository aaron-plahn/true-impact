import { TrueImpactError } from '../../../libs/data-types';
import { FlagViewModel } from './flag.view-model';

export interface IFlagQueryRepository {
  fetchById(id: string): Promise<FlagViewModel> | null; // Maybe<T>

  fetchMany(): Promise<FlagViewModel[]>;

  // Error || Ack
  create(instance: FlagViewModel): Promise<string | TrueImpactError>;

  // Error[] ?
  createMany(instances: FlagViewModel[]): Promise<void>;
}
