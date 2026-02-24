import { AggregateRoot, Ctor } from '../../libs/data-types';
import { InMemoryCommandRepository } from './in-memory-command-repository';

export class InMemoryCommandRepositoryProvider {
  forFeature<TEntity extends AggregateRoot<unknown>>(C: Ctor<TEntity>) {
    return new InMemoryCommandRepository<TEntity>(C);
  }
}
