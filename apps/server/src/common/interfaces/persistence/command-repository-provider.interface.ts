import { Entity } from '@true-impact/data-types';
import { IBaseCommandRepository } from './base-command-repository.interface';

export interface ICommandRepositoryProvider {
  /**
   * We **do not** want to maintain a magic lookup table to correlate aggregate types with
   * intance types. The caller always knows which repository \ aggregate root they are working with
   * unless they are using polymorphism, in which case they are programming to the base class anyway.
   */
  forAggregateRoot<T extends IBaseCommandRepository<Entity>>(type: string): T;
}
