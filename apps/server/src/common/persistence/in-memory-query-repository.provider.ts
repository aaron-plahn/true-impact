import { Ctor, ViewModel } from '../../libs';
import { InMemoryQueryRepository } from './in-memory-query-repository';

export class InMemoryQueryRepositoryProvider {
  forFeature<TViewModel extends ViewModel>(C: Ctor<TViewModel>) {
    return new InMemoryQueryRepository<TViewModel>(C);
  }
}
