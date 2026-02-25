import { appendMetadata } from './append-metadata';
import { TypeDecoratorOptions } from './type-decorator-options';

export const BOOLEAN = 'BOOLEAN';

/**
 * We call this decorator factory `BooleanDataType` because `Boolean` is already
 * taken (wrapper class for `boolean` primitive type).
 */
export function BooleanDataType(
  userOptions: TypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    appendMetadata(target, propertyKey, {
      ...userOptions,
      type: BOOLEAN,
    });
  };
}
