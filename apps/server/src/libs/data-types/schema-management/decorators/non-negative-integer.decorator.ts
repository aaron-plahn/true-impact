import { appendMetadata } from './append-metadata';
import { TypeDecoratorOptions } from './type-decorator-options';

export const NON_NEGATIVE_INTEGER = 'NON_NEGATIVE_INTEGER';

export function NonNegativeInteger(
  userOptions: TypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    appendMetadata(target, propertyKey, {
      ...userOptions,
      type: NON_NEGATIVE_INTEGER,
    });
  };
}
