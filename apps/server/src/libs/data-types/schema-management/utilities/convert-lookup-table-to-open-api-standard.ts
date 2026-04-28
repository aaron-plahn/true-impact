import {
  getDataSchemaFromClassCtor,
  LookupTablePropertyMetadata,
} from '../../schema-management/decorators';
import { convertToOpenApiSchema } from './convert-to-open-api-schema';
import { SchemaObject } from './open-api-spec.interface';

type LookupTableOpenApiSchema = {
  type: 'object';
  additionalProperties:
    | {
        type: 'string' | 'number' | 'boolean' | 'integer';
      }
    | SchemaObject;
};

export const convertLookupTableToOpenApiStandard = (
  meta: LookupTablePropertyMetadata,
): LookupTableOpenApiSchema => {
  if (meta.depth !== 1) {
    return {
      type: 'object',
      additionalProperties: convertLookupTableToOpenApiStandard({
        ...meta,
        depth: meta.depth - 1,
      }),
    };
  }

  if (typeof meta.valueType === 'function') {
    return {
      type: 'object',
      additionalProperties: convertToOpenApiSchema(
        getDataSchemaFromClassCtor(meta.valueType()),
      ),
    };
  }

  return {
    type: 'object',
    additionalProperties: {
      type: meta.valueType,
    },
  };
};
