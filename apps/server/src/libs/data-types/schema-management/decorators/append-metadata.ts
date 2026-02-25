const SCHEMA_PROPERTY_METADATA_KEY = '__SCHEMA_PROPERTY_METADATA_KEY__';
import { Ctor, DataKeys } from '../../utility-types';
import { TypeDecoratorOptions } from './type-decorator-options';

export type SimpleSchemaPropertyMetadata = {
  type: string;
  isOptional: boolean;
  isArray: boolean;
  mustBeUnique: boolean;
  label: string;
  description: string;
};

// This will be a union with `EnumPropertyMetadata`, `NestedSchemaMetadata`, and `UnionValuedSchemaPropertyMetadata`
export type SchemaPropertyMetadata = SimpleSchemaPropertyMetadata;

export type DataSchema<T = object> = {
  properties: DataKeys<T> extends never
    ? object
    : Record<DataKeys<T>, SchemaPropertyMetadata>;
};

export const getDataSchemaFromPrototype = <T = object>(
  target: object,
): DataSchema<DataKeys<T>> | null => {
  if (!Reflect.has(target, SCHEMA_PROPERTY_METADATA_KEY)) {
    return null;
  }

  return Reflect.get(target, SCHEMA_PROPERTY_METADATA_KEY) as DataSchema<
    DataKeys<T>
  >;
};

export const getDataSchemaFromClassCtor = <T>(
  target: Ctor<T>,
): DataSchema<DataKeys<T>> => {
  return (
    getDataSchemaFromPrototype<T>(target.prototype as object) ||
    ({
      properties: {},
    } as DataSchema<DataKeys<T>>)
  );
};

export const appendMetadata = (
  target: object,
  propertyKey: string | symbol,
  userOptions: TypeDecoratorOptions & { type: string },
) => {
  const propertyMetadata: SimpleSchemaPropertyMetadata = {
    ...userOptions,
    isArray: userOptions.isArray || false,
    isOptional: userOptions.isOptional || false,
    mustBeUnique: userOptions.mustBeUnique || false,
  };

  const existingMeta = getDataSchemaFromPrototype(target) || {
    properties: {},
  };

  Object.assign(propertyMetadata);

  existingMeta.properties[propertyKey as string] = propertyMetadata;

  Reflect.set(target, SCHEMA_PROPERTY_METADATA_KEY, existingMeta);
};
