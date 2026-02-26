import { appendSimplePropertyMetadata } from './append-metadata';
import { SimpleDataTypeDecoratorOptions } from './type-decorator-options';

// TODO Do we want an enum?
export const NON_EMPTY_STRING = 'NON_EMPTY_STRING';

export function NonEmptyString(
  userOptions: SimpleDataTypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    appendSimplePropertyMetadata(target, propertyKey, {
      ...userOptions,
      type: NON_EMPTY_STRING,
    });
  };
}
