import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import {
  InvariantValidationError,
  TrueImpactBadUserInputError,
} from '@true-impact/data-types';
import { map, Observable } from 'rxjs';
import { ResourceNotFoundException } from '../exceptions';

const isNotFound = (input: unknown) =>
  input === null || typeof input === 'undefined';

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
