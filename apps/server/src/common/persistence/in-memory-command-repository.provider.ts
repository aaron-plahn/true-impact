import { AggregateRoot, Ctor } from '../../libs/data-types';
import { InMemoryCommandRepository } from './in-memory-command-repository';

/**
 * Unless we expose a registration pattern, we should drop this now.
 */
export class InMemoryCommandRepositoryProvider {
  forFeature<
    TPersistenceDto extends { id: string; revision: number },
    TEntity extends AggregateRoot<TPersistenceDto>,
    TRepository,
  >(C: Ctor<TEntity> & { type: string }): TRepository {
    // @ts-expect-error Can we fix this?
    return new InMemoryCommandRepository<TPersistenceDto, TEntity>(C);
  }
}
