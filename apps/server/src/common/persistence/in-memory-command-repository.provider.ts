import { Ctor, Entity } from '../../libs';
import { InMemoryCommandRepository } from './in-memory-command-repository';

export class InMemoryCommandRepositoryProvider {
  forFeature<TEntity extends Entity>(C: Ctor<TEntity>) {
    return new InMemoryCommandRepository<TEntity>(C);
  }
}
