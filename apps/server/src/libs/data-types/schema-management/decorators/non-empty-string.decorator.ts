import { appendMetadata } from './append-metadata';

// TODO Do we want an enum?
export const NON_EMPTY_STRING = 'NON_EMPTY_STRING';

interface TypeDecoratorOptions {
  label: string;
  description: string;
  isOptional: boolean;
  isArray: boolean;
}

export function NonEmptyString(
  userOptions: TypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    appendMetadata(target, propertyKey, {
      ...userOptions,
      type: NON_EMPTY_STRING,
    });
  };
}
