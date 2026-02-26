import { appendSimplePropertyMetadata } from './append-metadata';
import { SimpleDataTypeDecoratorOptions } from './type-decorator-options';

export const NON_NEGATIVE_INTEGER = 'NON_NEGATIVE_INTEGER';

export function NonNegativeInteger(
  userOptions: SimpleDataTypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    appendSimplePropertyMetadata(target, propertyKey, {
      ...userOptions,
      type: NON_NEGATIVE_INTEGER,
    });
  };
}
