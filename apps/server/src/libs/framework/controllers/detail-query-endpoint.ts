import { Get } from './get.decorator';

export function DetailQueryEndpoint(): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<unknown>,
  ) {
    Get(`:id`)(target, propertyKey, descriptor);
  };
}
