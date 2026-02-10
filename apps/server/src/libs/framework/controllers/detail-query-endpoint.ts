import { Get } from './get.decorator';

export function DetailQueryEndpoint(): MethodDecorator {
  return Get(`:id`);
}
