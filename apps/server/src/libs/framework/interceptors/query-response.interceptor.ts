import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import {
  InvariantValidationError,
  ResourceNotFoundError,
  TrueImpactBadUserInputError,
} from '../../../libs/data-types';
import { ResourceNotFoundException } from '../exceptions';

/**
 * TODO We should either use a symbol or an internal error class
 * (e.g. `AggregateRootNotFoundError`) to represent "not found" instead
 * of the built-ins.
 */
const isNotFound = (input: unknown) =>
  input === null ||
  typeof input === 'undefined' ||
  input instanceof ResourceNotFoundError;

export class QueryResponseInterceptor<T> implements NestInterceptor<T, T> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T> | Promise<Observable<T>> {
    return next.handle().pipe(
      map((result) => {
        if (isNotFound(result)) {
          throw new ResourceNotFoundException();
        }

        if (result instanceof InvariantValidationError) {
          throw new TrueImpactBadUserInputError([result]);
        }

        if (result instanceof TrueImpactBadUserInputError) {
          throw result;
        }

        return result;
      }),
    );
  }
}
