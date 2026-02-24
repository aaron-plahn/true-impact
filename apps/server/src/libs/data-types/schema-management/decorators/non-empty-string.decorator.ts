import { appendMetadata } from './append-metadata';

// TODO Do we want an enum?
export const NON_EMPTY_STRING = 'NON_EMPTY_STRING';

interface TypeDecoratorOptions {
  label: string;
  description: string;
  // TODO remove these in existing decorators where set explicitly to `false`
  isOptional?: boolean;
  isArray?: boolean;
  /**
   * Defaults to false. If "true", the database implementer should leverage the schema
   * to set a uniqueness constraint within the given collection \ table that stores
   * the given entity.
   */
  mustBeUnique?: boolean;
}

export function NonEmptyString(
  userOptions: TypeDecoratorOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    appendMetadata(target, propertyKey, {
      ...userOptions,
      isArray: userOptions?.isArray || false,
      isOptional: userOptions?.isOptional || false,
      mustBeUnique: userOptions?.mustBeUnique || false,
      type: NON_EMPTY_STRING,
    });
  };
}
