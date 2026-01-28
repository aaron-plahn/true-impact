import { TrueImpactError } from "../error-handling";
import { NON_EMPTY_STRING } from "../schema-management";
import {
  DataSchema,
  SimpleSchemaPropertyMetadata,
} from "../schema-management/decorators/append-metadata";
import { isNonEmptyString } from "./predicates";

export const validateObjectAgainstSchema = <T = object>(
  o: T,
  schema: DataSchema,
): TrueImpactError[] => {
  const allErrors = Object.entries(schema.properties).reduce(
    (
      acc: TrueImpactError[],
      [k, propertySchema]: [string, SimpleSchemaPropertyMetadata],
    ) => {
      const value = o[k];

      if (propertySchema.type === NON_EMPTY_STRING) {
        if (value === null || typeof value === "undefined") {
          return acc;
        }

        if (!isNonEmptyString(value)) {
          acc.push(
            new TrueImpactError(
              `Invalid value for property [${k}]. Expected non-empty text. Received: ${value}`,
            ),
          );
        }
      }

      return acc;
    },
    [],
  );

  return allErrors;
};
