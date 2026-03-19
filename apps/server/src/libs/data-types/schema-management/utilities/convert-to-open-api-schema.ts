import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../error-handling';
import {
  BOOLEAN,
  DataSchema,
  getDataSchemaFromClassCtor,
  isArraySchemaPropertyMetadata,
  isEnumeratedTypeSchemaPropertyMetadata,
  isObjectSchemaPropertyMetadata,
  NON_EMPTY_STRING,
  NON_NEGATIVE_INTEGER,
  SchemaPropertyMetadata,
} from '../../schema-management/decorators';
import { SchemaObject as OpenApiSchema } from './open-api-spec.interface';

const trueImpactDataTypeToOpenApiDataType = {
  [NON_EMPTY_STRING]: 'string',
  [NON_NEGATIVE_INTEGER]: 'integer',
  [BOOLEAN]: 'boolean',
} as const;

const getOpenApiDataTypeForTrueImpactDataType = (
  trueImpactDataType: string,
): string => {
  if (!(trueImpactDataType in trueImpactDataTypeToOpenApiDataType)) {
    throw new TrueImpactRuntimeException([
      new TrueImpactError(
        `Failed to convert internal schema to Open API schema. Encountered unknown simple property type: ${trueImpactDataType}.`,
      ),
    ]);
  }

  return trueImpactDataTypeToOpenApiDataType[trueImpactDataType] as string;
};

const convertPropertySchemaMetadataToOpenApiSchema = (
  meta: SchemaPropertyMetadata,
): OpenApiSchema => {
  if (isObjectSchemaPropertyMetadata(meta)) {
    /**
     * We recurse at top-level because we have a nested reference to another class.
     */
    return convertToOpenApiSchema(getDataSchemaFromClassCtor(meta.getCtor()));
  }

  if (isArraySchemaPropertyMetadata(meta)) {
    const result: OpenApiSchema = {
      type: 'array',
    };

    return result;
  }

  if (isEnumeratedTypeSchemaPropertyMetadata(meta)) {
    return {
      type: 'string',
      // TODO Should this be labelsAndValues or labelsToValues?
      enum: Array.from(Object.values(meta.valuesAndLabels)),
    };
  }

  // we have a simple-property definition here
  return {
    type: getOpenApiDataTypeForTrueImpactDataType(meta.type),
  };
};

export const convertToOpenApiSchema = <T = object>(
  schema: DataSchema<T>,
): OpenApiSchema => {
  const result: OpenApiSchema = {};

  if (schema.properties) {
    const properties: Record<string, OpenApiSchema> = {};

    Object.entries(schema.properties).forEach(
      ([propertyKey, schemaForProperty]: [string, SchemaPropertyMetadata]) => {
        properties[propertyKey] =
          convertPropertySchemaMetadataToOpenApiSchema(schemaForProperty);
      },
    );

    result.properties = properties;
  }

  return result;
};
