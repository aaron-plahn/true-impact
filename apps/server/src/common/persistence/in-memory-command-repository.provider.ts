import { AggregateRoot, Ctor } from '../../libs/data-types';
import { IBaseCommandRepository } from '../interfaces/persistence';
import { InMemoryCommandRepository } from './in-memory-command-repository';

export class InMemoryCommandRepositoryProvider {
  forFeature<
    TPersistenceDto extends { id: string; revision: number },
    TEntity extends AggregateRoot<TPersistenceDto>,
  >(C: Ctor<TEntity> & { type: string }): IBaseCommandRepository<TEntity> {
    // @ts-expect-error Can we fix this?
    return new InMemoryCommandRepository<TPersistenceDto, TEntity>(C);
  }
}
