import { appendSimplePropertyMetadata } from './append-metadata';
import { SimpleDataTypeDecoratorOptions } from './type-decorator-options';

export const EMAIL_ADDRESS = 'EMAIL_ADDRESS';

export function EmailAddress(
  userOptions: SimpleDataTypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    appendSimplePropertyMetadata(target, propertyKey, {
      ...userOptions,
      type: EMAIL_ADDRESS,
    });
  };
}
