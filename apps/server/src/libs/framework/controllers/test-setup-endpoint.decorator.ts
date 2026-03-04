import { Patch } from './patch.decorator';

/**
 * This prevents the endpoint from being wired up outside of a test environment.
 */
export function TestSetupEndpoint(): MethodDecorator {
  if (process.env.NODE_ENV === 'test') {
    return Patch('test-setup');
  }

  return function () {
    // no-op
  };
}
