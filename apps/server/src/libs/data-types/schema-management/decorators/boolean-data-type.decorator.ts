import { appendSimplePropertyMetadata } from './append-metadata';
import { SimpleDataTypeDecoratorOptions } from './type-decorator-options';

export const BOOLEAN = 'BOOLEAN';

// TODO remove this in favour of `@Literal`
/**
 * We call this decorator factory `BooleanDataType` because `Boolean` is already
 * taken (wrapper class for `boolean` primitive type).
 */
export function BooleanDataType(
  userOptions: SimpleDataTypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    appendSimplePropertyMetadata(target, propertyKey, {
      ...userOptions,
      type: BOOLEAN,
    });
  };
}
