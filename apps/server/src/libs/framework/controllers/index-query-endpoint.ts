import { Get } from './get.decorator';

export function IndexQueryEndpoint(): MethodDecorator {
  return Get('');
}
