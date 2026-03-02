import { AggregateRoot, Ctor } from '../../libs/data-types';
import { InMemoryCommandRepository } from './in-memory-command-repository';

export class InMemoryCommandRepositoryProvider {
  forFeature<
    TPersistenceDto extends { id: string; revision: number },
    TEntity extends AggregateRoot<TPersistenceDto>,
  >(C: Ctor<TEntity> & { type: string }) {
    return new InMemoryCommandRepository<TPersistenceDto, TEntity>(C);
  }
}
