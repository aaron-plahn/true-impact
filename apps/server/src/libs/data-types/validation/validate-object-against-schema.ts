import { TrueImpactError, TrueImpactRuntimeException } from '../error-handling';
import {
  BOOLEAN,
  NON_EMPTY_STRING,
  NON_NEGATIVE_INTEGER,
} from '../schema-management';
import {
  ArrayItemObjectSchema,
  DataSchema,
  getDataSchemaFromClassCtor,
  isArraySchemaPropertyMetadata,
  isObjectSchemaPropertyMetadata,
  SchemaPropertyMetadata,
} from '../schema-management/decorators/append-metadata';
import {
  isBoolean,
  isInteger,
  isNegativeNumber,
  isNonEmptyString,
  isNumber,
} from './predicates';

const buildSimplePropertyErrorMessage = (
  propertyKey: string,
  value: unknown,
  expectedTypeLabel: string,
  index?: number,
) =>
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  `Invalid value for property [${propertyKey}${index ? '@' + index : ''}]. Expected ${expectedTypeLabel}, but received [${value}]`;

const validateSimpleDataType = (
  propertyKey: string,
  value: unknown,
  propertySchema: {
    type: string;
    isOptional: boolean;
    index?: number;
  },
): TrueImpactError[] => {
  const acc: TrueImpactError[] = [];

  if (value === null || typeof value === 'undefined') {
    if (propertySchema.isOptional) {
      return acc;
    }

    acc.push(new TrueImpactError(`Missing required property [${propertyKey}]`));

    return acc;
  }

  if (propertySchema.type === NON_EMPTY_STRING) {
    if (!isNonEmptyString(value)) {
      acc.push(
        new TrueImpactError(
          buildSimplePropertyErrorMessage(
            propertyKey,
            value,
            'non-empty text',
            propertySchema.index,
          ),
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
          buildSimplePropertyErrorMessage(
            propertyKey,
            value,
            'non-negative integer',
          ),
        ),
      );
    }

    return acc;
  }

  if (propertySchema.type === BOOLEAN) {
    if (!isBoolean(value)) {
      acc.push(
        new TrueImpactError(
          buildSimplePropertyErrorMessage(
            propertyKey,
            value,
            'boolean (logical true or false)',
          ),
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
};

export const validateObjectAgainstSchema = <T = object>(
  o: T,
  schema: DataSchema,
): TrueImpactError[] => {
  const allErrors = Object.entries(schema.properties).reduce(
    (
      acc: TrueImpactError[],
      [k, propertySchema]: [string, SchemaPropertyMetadata],
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value = o[k];

      if (isArraySchemaPropertyMetadata(propertySchema)) {
        if (!Array.isArray(value)) {
          acc.push(
            new TrueImpactError(
              `Invalid value for property [${k}]. Expected an array, received [${value}]`,
            ),
          );

          return acc;
        }

        // TODO if the array cannot be empty, but is, return an error

        const nestedErrors = value.flatMap((item, index) => {
          if (propertySchema.items.type === 'object') {
            const CtorForItems = (
              propertySchema.items as ArrayItemObjectSchema
            ).getCtor();

            const nestedSchema = getDataSchemaFromClassCtor(CtorForItems);

            return validateObjectAgainstSchema(item, nestedSchema);
          }

          return validateSimpleDataType(k, item, {
            type: propertySchema.items.type,
            isOptional: false,
            index,
          });
        });

        acc.push(...nestedErrors);

        return acc;
      }

      if (isObjectSchemaPropertyMetadata(propertySchema)) {
        const nestedCtor = propertySchema.getCtor();

        // we need to make sure the value is actually an object
        if (typeof value === 'undefined' || value === null) {
          if (!propertySchema.isOptional) {
            acc.push(new TrueImpactError(`Missing required property [${k}]`));
          }

          return acc;
        }

        // TODO either use `isPrimitive` or `!isObject` or `!isNonEmptyObject`
        if (isNumber(value) || typeof value === 'string' || isBoolean(value)) {
          acc.push(
            new TrueImpactError(
              `Invalid value for property [${k}]. Expected object, received [${value}].`,
            ),
          );

          return acc;
        }

        acc.push(
          ...validateObjectAgainstSchema(
            value,
            getDataSchemaFromClassCtor(nestedCtor),
          ),
        );

        return acc;
      }

      acc.push(...validateSimpleDataType(k, value, propertySchema));

      return acc;
    },
    [],
  );

  return allErrors;
};
