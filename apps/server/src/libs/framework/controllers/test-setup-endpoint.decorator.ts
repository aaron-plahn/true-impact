import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Patch } from './patch.decorator';

/**
 * This prevents the endpoint from being wired up outside of a test environment.
 */
export function TestSetupEndpoint(): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    ApiExcludeEndpoint()(target, propertyKey, descriptor);

    if (process.env.NODE_ENV === 'test') {
      return Patch('test-setup')(target, propertyKey, descriptor);
    }
  };
}
