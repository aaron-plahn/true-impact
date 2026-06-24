import { appendSimplePropertyMetadata } from './append-metadata';
import { SimpleDataTypeDecoratorOptions } from './type-decorator-options';

export const RAW_OBJECT = 'RAW_OBJECT';

/**
 * **DO NOT** use this for user-facing DTOs (command payload schemas).
 * A property decorated with this type will not be validated beyond ensuring
 * that it is an ordinary JS object.
 *
 * The use case for this is event records on domain models. We build the events after
 * validating user input data and we own the structure of events. We wanted to kick
 * the can up the road on a union factory \ validator.
 */
export function RawObject(
  userOptions: SimpleDataTypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    appendSimplePropertyMetadata(target, propertyKey, {
      ...userOptions,
      type: RAW_OBJECT,
    });
  };
}
