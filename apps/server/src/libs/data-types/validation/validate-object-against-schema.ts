import { TrueImpactError, TrueImpactRuntimeException } from '../error-handling';
import {
  BOOLEAN,
  NON_EMPTY_STRING,
  NON_NEGATIVE_INTEGER,
} from '../schema-management';
import {
  DataSchema,
  SimpleSchemaPropertyMetadata,
} from '../schema-management/decorators/append-metadata';
import {
  isBoolean,
  isInteger,
  isNegativeNumber,
  isNonEmptyString,
} from './predicates';

export const validateObjectAgainstSchema = <T = object>(
  o: T,
  schema: DataSchema,
): TrueImpactError[] => {
  const allErrors = Object.entries(schema.properties).reduce(
    (
      acc: TrueImpactError[],
      [k, propertySchema]: [string, SimpleSchemaPropertyMetadata],
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value = o[k];

      if (propertySchema.isOptional) {
        if (value === null || typeof value === 'undefined') {
          return acc;
        }
      }

      if (propertySchema.type === NON_EMPTY_STRING) {
        if (!isNonEmptyString(value)) {
          acc.push(
            new TrueImpactError(
              `Invalid value for property [${k}]. Expected non-empty text. Received: ${value}`,
            ),
          );
        }

        return acc;
      }

      if (propertySchema.type === NON_NEGATIVE_INTEGER) {
        if (isNegativeNumber(value) || !isInteger(value)) {
          acc.push(
            // TODO inject error factory
            new TrueImpactError(
              `Invalid value for property [${k}]. Expected non-negative integer. Received: ${value}`,
            ),
          );
        }

        return acc;
      }

      if (propertySchema.type === BOOLEAN) {
        if (!isBoolean(value)) {
          acc.push(
            new TrueImpactError(
              `Invalid value for property [${k}]. Expected non-negative integer. Received: ${value}`,
            ),
          );
        }

        return acc;
      }

      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Failed to validate property of unknown type: ${propertySchema.type}`,
        ),
      ]);
    },
    [],
  );

  return allErrors;
};
