import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../error-handling';
import {
  DataSchema,
  getDataSchemaFromClassCtor,
  isArrayItemObjectSchema,
  isArraySchemaPropertyMetadata,
  isEnumeratedTypeSchemaPropertyMetadata,
  isLiteralDataTypeMetadata,
  isLookupTablePropertyMetadata,
  isObjectSchemaPropertyMetadata,
  SchemaPropertyMetadata,
} from '../../schema-management/decorators';
import { convertLookupTableToOpenApiStandard } from './convert-lookup-table-to-open-api-standard';
import { SchemaObject as OpenApiSchema } from './open-api-spec.interface';

const trueImpactDataTypeToOpenApiDataType = {
  NON_EMPTY_STRING: 'string',
  NON_NEGATIVE_INTEGER: 'integer',
  BOOLEAN: 'boolean',
  RAW_OBJECT: 'object',
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
    const { items } = meta;

    if (isArrayItemObjectSchema(items)) {
      const itemCtor = items.getCtor();

      const rawItemSchema = getDataSchemaFromClassCtor(itemCtor);

      const itemSchema = convertToOpenApiSchema(rawItemSchema);

      const result: OpenApiSchema = {
        type: 'array',
        items: itemSchema,
      };

      return result;
    }

    const result: OpenApiSchema = {
      type: 'array',
      items: {
        type: getOpenApiDataTypeForTrueImpactDataType(meta.items.type),
      },
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

  if (isLookupTablePropertyMetadata(meta)) {
    return convertLookupTableToOpenApiStandard(meta);
  }

  if (isLiteralDataTypeMetadata(meta)) {
    return {
      type: typeof meta.value,
      // OpenAPI treats literals as enums with only one variant
      enum: [meta.value],
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
