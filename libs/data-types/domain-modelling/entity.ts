import { InvariantValidationError, TrueImpactError } from "../error-handling";
import {
  DataSchema,
  getDataSchemaFromClassCtor,
} from "../schema-management/decorators/append-metadata";
import { DataKeys, DataProperties } from "../utility-types";
import { validateObjectAgainstSchema } from "../validation/validate-object-against-schema";

type Foo = DataProperties<Entity>;

type FooKeys = DataKeys<Entity>; // DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES

type S = DataSchema<Entity>;

export abstract class Entity {
  validateAgainstSchema(): TrueImpactError[] {
    const schema = getDataSchemaFromClassCtor(
      Object.getPrototypeOf(this).constructor,
    );

    return validateObjectAgainstSchema(this, schema);
  }

  /**
   * Complex invariants are those invariants that require inspection of more than
   * one property's value at a time. An example is the rule that one of `foo` and `bar` must be
   * defined or that `baz` must be greater than `biz`. Such rules must be implemented by the
   * implementer of the child class. We do not provide a default implementation because we want
   * to force the implementer to explicity specify that there are no complex invariants if that is the case.
   */
  abstract validateComplexInvariants(): TrueImpactError[];

  /**
   * @returns an array of all validation errors encountered including schema errors (automatic)
   * and errors from the call to `validateComplexInvariants` (must be implemented by the class extending `Entity`).
   * Skips calling `validateComplexInvariants` if the schema validation fails to avoid the need for extensive null checks.
   */
  validateInvariants<T extends Entity>(this: T): TrueImpactError | T {
    const schemaValidationErrors = this.validateAgainstSchema();

    if (schemaValidationErrors.length > 0) {
      return this.buildInvariantValidationError(schemaValidationErrors);
    }

    const complexInvariantValidationErrors = this.validateComplexInvariants();

    if (complexInvariantValidationErrors.length > 0) {
      return this.buildInvariantValidationError(
        complexInvariantValidationErrors,
      );
    }

    return this;
  }

  private buildInvariantValidationError(
    innerErrors: TrueImpactError[],
  ): InvariantValidationError {
    return new InvariantValidationError(
      Object.getPrototypeOf(this).constructor,
      innerErrors,
    );
  }
}
