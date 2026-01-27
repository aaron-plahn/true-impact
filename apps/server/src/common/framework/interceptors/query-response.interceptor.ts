import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
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

        // TODO check for bad user input error

        return result;
      }),
    );
  }
}
