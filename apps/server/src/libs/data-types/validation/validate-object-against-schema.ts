import { isFunction } from 'rxjs/internal/util/isFunction';
import { TrueImpactError, TrueImpactRuntimeException } from '../error-handling';
import {
  BOOLEAN,
  ENUMERATED_TYPE,
  NON_EMPTY_STRING,
  NON_NEGATIVE_INTEGER,
  RAW_OBJECT,
} from '../schema-management';
import {
  ArrayItemObjectSchema,
  DataSchema,
  EnumeratedTypeSchemaPropertyMetadata,
  getDataSchemaFromClassCtor,
  isArraySchemaPropertyMetadata,
  isLookupTablePropertyMetadata,
  isObjectSchemaPropertyMetadata,
  isSetPropertyMetadata,
  SchemaPropertyMetadata,
} from '../schema-management/decorators/append-metadata';
import {
  isBoolean,
  isInteger,
  isNegativeNumber,
  isNonEmptyString,
  isNumber,
  isObject,
} from './predicates';
import { validateLookupTable } from './validate-lookup-table';

const buildLabelForArbitraryValue = (value: unknown): string => {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'undefined') {
    return 'undefined';
  }

  if (isObject(value)) {
    return 'object';
  }

  if (isFunction(value)) {
    return 'function';
  }

  return JSON.stringify(value);
};

const buildSimplePropertyErrorMessage = (
  propertyKey: string,
  value: unknown,
  expectedTypeLabel: string,
  index?: number,
) => {
  const valueLabel =
    value === null ? 'null' : `${buildLabelForArbitraryValue(value)}`;

  return `Invalid value for property [${propertyKey}${index ? '@' + index : ''}]. Expected ${expectedTypeLabel}, but received [${valueLabel}]`;
};

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

  if (propertySchema.type === ENUMERATED_TYPE) {
    const { valuesAndLabels } =
      propertySchema as EnumeratedTypeSchemaPropertyMetadata;

    const allowedValues = Array.from(Object.values(valuesAndLabels));

    if (!allowedValues.some((v) => value === v)) {
      acc.push(
        new TrueImpactError(
          buildSimplePropertyErrorMessage(
            propertyKey,
            value,
            `one of: ${allowedValues.join(', ')}`,
          ),
        ),
      );
    }

    return acc;
  }

  if (propertySchema.type === RAW_OBJECT) {
    if (!isObject(value)) {
      acc.push(
        new TrueImpactError(
          buildSimplePropertyErrorMessage(propertyKey, value, `object`),
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

interface SchemaBasedValidationOptions {
  shouldAllowUnknownProperties?: boolean;
}

export const validateObjectAgainstSchema = <T = object>(
  o: T,
  schema: DataSchema,
  options: SchemaBasedValidationOptions = {},
): TrueImpactError[] => {
  // schema based validation errors for known properties in the schema
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

        if (!propertySchema.canBeEmpty && value.length === 0) {
          acc.push(
            new TrueImpactError(
              `Invalid value for property [${k}]. Array must not be empty.`,
            ),
          );
        }

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

      if (isLookupTablePropertyMetadata(propertySchema)) {
        acc.push(...validateLookupTable(propertySchema, k, value));

        return acc;
      }

      if (isSetPropertyMetadata(propertySchema)) {
        if (!(value instanceof Set)) {
          acc.push(
            new TrueImpactError(
              `Invalid value for property [${k}]. Expected a Set, but received (${value === null ? 'null' : typeof value})`,
            ),
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        value.forEach((el: unknown) => {
          if (typeof propertySchema.valueType === 'function') {
            const nestedErrors = validateObjectAgainstSchema(
              el,
              getDataSchemaFromClassCtor(propertySchema.valueType()),
            );

            nestedErrors.forEach((ne) => acc.push(ne));

            return;
          }

          const actualJsTypeOfValue = typeof el;

          if (actualJsTypeOfValue !== propertySchema.valueType) {
            acc.push(
              new TrueImpactError(
                `Invalid value for Set element. Expected [${propertySchema.valueType}], received: ${actualJsTypeOfValue}`,
              ),
            );

            return;
          }
        });

        return acc;
      }

      acc.push(...validateSimpleDataType(k, value, propertySchema));

      return acc;
    },
    [],
  );

  // here we prevent unknown properties from being included
  const shouldAllowUnknownProperties =
    typeof options.shouldAllowUnknownProperties === 'boolean'
      ? options.shouldAllowUnknownProperties
      : false;

  if (!shouldAllowUnknownProperties) {
    /**
     * Arrays can only have integer-indexed properties. There is no risk of superfluous
     * property injection when validating arrays.
     */
    if (o !== null && typeof o === 'object' && !Array.isArray(o)) {
      Object.keys(o).forEach((propertyName) => {
        if (!(propertyName in schema.properties)) {
          allErrors.push(
            new TrueImpactError(`Unknown property: ${propertyName}`),
          );
        }
      });
    }
  }

  return allErrors;
};
