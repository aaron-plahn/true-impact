import { TrueImpactError } from '../../../libs/data-types';
import { CommunityViewModel } from './community.view-model';

export interface ICommunityQueryRepository {
  fetchById(id: string): Promise<CommunityViewModel> | null; // Maybe<T>

  fetchMany(): Promise<CommunityViewModel[]>;

  // Error || Ack
  create(instance: CommunityViewModel): Promise<string | TrueImpactError>;

  // Error[] ?
  createMany(instances: CommunityViewModel[]): Promise<void>;
}
