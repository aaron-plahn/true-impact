/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../libs/data-types';
import {
  getDataSchemaFromClassCtor,
  LookupTablePropertyMetadata,
} from '../schema-management';
import { validateObjectAgainstSchema } from '../validation';

export const validateLookupTable = (
  propertySchema: LookupTablePropertyMetadata,
  propertyKey: string,
  value: unknown,
) => {
  const errors: TrueImpactError[] = [];

  //   if (propertySchema.depth > 1) {
  //     throw new Error(`Lookup Tables with depth != 1 are not yet supported`);
  //   }

  // lookup tables are never optional, although they may be empty
  if (!value) {
    errors.push(
      new TrueImpactError(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Invalid value for property [${propertyKey}]. Expected a lookup table (Record<string,T>), received [${value}]`,
      ),
    );

    return errors;
  }

  const jsType = typeof value;

  if (
    jsType === 'string' ||
    jsType === 'bigint' ||
    jsType === 'boolean' ||
    jsType === 'function' ||
    jsType === 'number' ||
    jsType === 'symbol'
  ) {
    errors.push(
      new TrueImpactError(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions

        `Invalid value for property [${propertyKey}]. Expected a lookup table (Record<string,T>), received [${value} <${jsType}>]`,
      ),
    );
    return errors;
  }

  if (Array.isArray(value)) {
    errors.push(
      new TrueImpactError(
        `Invalid value for property [${propertyKey}]. Expected a lookup table (Record<string,T>), received an array.`,
      ),
    );

    return errors;
  }

  // the lookup table has primitive type values
  Object.entries(value as Record<string, unknown>).forEach(
    ([lookupKey, lookupValue]) => {
      if (typeof propertySchema.valueType === 'function') {
        const schemaForLookupTableValues = getDataSchemaFromClassCtor(
          propertySchema.valueType(),
        );

        Object.entries(value as Record<string, unknown>).forEach(
          ([lookupKey, lookupValue]) => {
            const result = validateObjectAgainstSchema(
              lookupValue,
              schemaForLookupTableValues,
            );

            if (result.length > 0) {
              errors.push(
                new TrueImpactError(
                  `Invalid value for property [${propertyKey}] @key [${lookupKey}].`,
                  result,
                ),
              );
            }
          },
        );

        return errors;
      }

      if (
        propertySchema.valueType === 'number' ||
        propertySchema.valueType === 'integer'
      ) {
        if (typeof lookupValue !== 'number') {
          errors.push(
            new TrueImpactError(
              `Invalid value for property [${propertyKey}] @key [${lookupKey}]. Expected ${propertySchema.valueType}, recevied [${value} <${typeof value}>]`,
            ),
          );
        }

        return errors;
      }

      if (propertySchema.valueType === 'boolean') {
        if (typeof lookupValue !== 'boolean') {
          errors.push(
            new TrueImpactError(
              `Invalid value for property [${propertyKey}] @key [${lookupKey}]. Expected boolean, recevied [${value} <${typeof value}>]`,
            ),
          );

          return errors;
        }

        return errors;
      }

      if (propertySchema.valueType === 'string') {
        if (typeof lookupValue !== 'string') {
          errors.push(
            new TrueImpactError(
              `Invalid value for property [${propertyKey}] @key [${lookupKey}]. Expected string, recevied [${value} <${typeof value}>]`,
            ),
          );

          return errors;
        }

        return errors;
      }

      const exhaustiveCheck: never = propertySchema.valueType;

      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Failed to validate lookup table [${propertyKey}] with values of invalid type [${exhaustiveCheck as string}].`,
        ),
      ]);
    },
  );

  return errors;
};
