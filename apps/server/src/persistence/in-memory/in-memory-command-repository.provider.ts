import { Entity } from '@true-impact/data-types';
import {
  IBaseCommandRepository,
  ICommandRepositoryProvider,
} from 'src/common/interfaces/persistence';

export class InMemoryCommandRepositoryProvider implements ICommandRepositoryProvider {
  forAggregateRoot<T extends IBaseCommandRepository<Entity>>(type: string): T {
    throw new Error('Method not implemented.');
  }
}
