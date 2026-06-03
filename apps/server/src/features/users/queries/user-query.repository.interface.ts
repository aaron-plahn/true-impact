import { TrueImpactError } from 'src/libs/data-types';
import { UserViewModel } from './user.view-model';

export interface IUserQueryRepository {
  fetchById(id: string): Promise<UserViewModel | TrueImpactError>;
}
