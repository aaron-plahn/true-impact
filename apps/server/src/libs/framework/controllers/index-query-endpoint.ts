import { Get } from '@nestjs/common';

export function DetailQueryEndpoint(): MethodDecorator {
  return Get(`/:id`);
}
