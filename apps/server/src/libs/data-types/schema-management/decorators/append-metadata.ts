const SCHEMA_PROPERTY_METADATA_KEY = '__SCHEMA_PROPERTY_METADATA_KEY__';
import { Ctor, DataKeys } from '../../utility-types';
import { SimpleDataTypeDecoratorOptions } from './type-decorator-options';

export type ObjectSchemaPropertyMetadata = {
  type: 'object';
  isOptional: boolean;
  label: string;
  description: string;
  getCtor: () => Ctor;
};

export const isObjectSchemaPropertyMetadata = (
  input: unknown,
): input is ObjectSchemaPropertyMetadata =>
  (input as ObjectSchemaPropertyMetadata).type === 'object';

export type SimpleSchemaPropertyMetadata = {
  type: string;
  isOptional: boolean;
  mustBeUnique: boolean;
  label: string;
  description: string;
};

export const isArraySchemaPropertyMetadata = (
  input: unknown,
): input is ArraySchemaPropertyMetadata =>
  (input as ArraySchemaPropertyMetadata).type === 'array';

export type ArrayItemObjectSchema = {
  type: 'object';
  getCtor: () => Ctor;
};

export type ArrayItemSimpleSchema = {
  type: string;
};

export type ArrayItemSchema = ArrayItemObjectSchema | ArrayItemSimpleSchema;

export type ArraySchemaPropertyMetadata = {
  type: 'array';
  canBeEmpty: boolean;
  // key?: string;
  label: string;
  description: string;
  // we will need to update this if we want to allow arrays of arrays
  items: ArrayItemSchema;
};

// This will be a union with `EnumPropertyMetadata`, `NestedSchemaMetadata`, and `UnionValuedSchemaPropertyMetadata`
export type SchemaPropertyMetadata =
  | SimpleSchemaPropertyMetadata
  | ObjectSchemaPropertyMetadata
  | ArraySchemaPropertyMetadata;

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
  propertyMetadata: SchemaPropertyMetadata,
) => {
  const existingMeta = getDataSchemaFromPrototype(target) || {
    properties: {},
  };

  existingMeta.properties[propertyKey as string] = propertyMetadata;

  Reflect.set(target, SCHEMA_PROPERTY_METADATA_KEY, existingMeta);
};

export const appendSimplePropertyMetadata = (
  target: object,
  propertyKey: string | symbol,
  userOptions: SimpleDataTypeDecoratorOptions & { type: string },
) => {
  const propertyMetadata: SimpleSchemaPropertyMetadata = {
    ...userOptions,
    isOptional: userOptions.isOptional || false,
    mustBeUnique: userOptions.mustBeUnique || false,
  };

  if (userOptions.isArray) {
    const fullMeta: ArraySchemaPropertyMetadata = {
      type: 'array',
      canBeEmpty: userOptions.isArray || false,
      label: userOptions.label,
      description: userOptions.description,
      items: {
        type: userOptions.type,
      },
    };

    appendMetadata(target, propertyKey, fullMeta);

    return;
  }

  appendMetadata(target, propertyKey, propertyMetadata);
};
