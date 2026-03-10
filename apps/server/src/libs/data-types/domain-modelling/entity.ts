/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  InvariantValidationError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../error-handling';
import { getDataSchemaFromClassCtor } from '../schema-management/decorators/append-metadata';
import { validateObjectAgainstSchema } from '../validation/validate-object-against-schema';

export abstract class Entity<TEntityPersistenceDto = unknown> {
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

  abstract getId(): string;

  abstract getName(): string;

  /**
   * @returns an array of all validation errors encountered including schema errors (automatic)
   * and errors from the call to `validateComplexInvariants` (must be implemented by the class extending `Entity`).
   * Skips calling `validateComplexInvariants` if the schema validation fails to avoid the need for extensive null checks.
   */
  validateInvariants<T extends Entity>(this: T): InvariantValidationError | T {
    const schemaValidationErrors = this.validateAgainstSchema();

    if (schemaValidationErrors.length > 0) {
      return this.buildInvariantValidationError(schemaValidationErrors);
    }

    const complexInvariantValidationErrors = this.validateComplexInvariants();

    /**
     * TODO We should call "validateComplexInvariants" for all nested entities.
     */

    if (complexInvariantValidationErrors.length > 0) {
      return this.buildInvariantValidationError(
        complexInvariantValidationErrors,
      );
    }

    return this;
  }

  abstract toPersistenceDto(): TEntityPersistenceDto;

  static fromPersistenceDto(
    _dto: any,
    _buildOptions?: { shouldValidate?: boolean },
  ): Entity | TrueImpactError {
    throw new TrueImpactRuntimeException([
      new TrueImpactError(
        'fromPersistenceDto must be implemented on any child class of Entity',
      ),
    ]);
  }

  private buildInvariantValidationError(
    innerErrors: TrueImpactError[],
  ): InvariantValidationError {
    return new InvariantValidationError(
      Object.getPrototypeOf(this).constructor,
      this.getName(),
      innerErrors,
    );
  }
}
