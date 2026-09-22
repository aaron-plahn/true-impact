import { DomainEvent } from '../../cqrs-es';
import {
  getDataSchemaFromClassCtor,
  InvariantValidationError,
  TrueImpactError,
  TrueImpactRuntimeException,
  validateObjectAgainstSchema,
} from '../../data-types';
import { Entity } from './entity';

interface BasePersistenceDto {
  id: string; // required
  revision: number;
}

// TODO rename this and move it to a separate file
export abstract class AggregateRoot<
  TPersistenceDto extends BasePersistenceDto = BasePersistenceDto,
> extends Entity<TPersistenceDto> {
  abstract id?: string;

  abstract revision: number;

  // TODO event history

  /**
   * Nested entities do not typically have a system ID (e.g. sequential ID or UUID) as they are persisted and
   * updated only within the context of the parent aggregate root. Instead, they have local identifiers,
   * such as a page number within the context of a book or a question label within the context of a survey.
   */
  override getId(): string {
    return this.id || 'NOT YET PERSISTED';
  }
}

export abstract class EventSourcedAggregateRoot {
  // id: string?
  abstract id?: string;

  abstract revision: number;

  eventHistory: DomainEvent[];

  constructor(_dto: Record<string, unknown>) {}

  validateAgainstSchema(): TrueImpactError[] {
    const schema = getDataSchemaFromClassCtor(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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

  abstract getName(): string;

  /**
   * @returns an array of all validation errors encountered including schema errors (automatic)
   * and errors from the call to `validateComplexInvariants` (must be implemented by the class extending `Entity`).
   * Skips calling `validateComplexInvariants` if the schema validation fails to avoid the need for extensive null checks.
   */
  validateInvariants<T extends EventSourcedAggregateRoot>(
    this: T,
  ): InvariantValidationError | T {
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

  private buildInvariantValidationError(
    innerErrors: TrueImpactError[],
  ): InvariantValidationError {
    return new InvariantValidationError(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      Object.getPrototypeOf(this).constructor,
      this.getName(),
      innerErrors,
    );
  }

  /**
   * Nested entities do not typically have a system ID (e.g. sequential ID or UUID) as they are persisted and
   * updated only within the context of the parent aggregate root. Instead, they have local identifiers,
   * such as a page number within the context of a book or a question label within the context of a survey.
   */
  getId(): string {
    return this.id || 'NOT YET PERSISTED';
  }

  apply<T extends this>(this: T, event: DomainEvent): T | TrueImpactError {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const eventCtorName = Object.getPrototypeOf(event).constructor.name;

    // We have an instance to work with already.
    const magicUpdateMethodName = `handle${eventCtorName}`;

    if (typeof this[magicUpdateMethodName] !== 'function') {
      // `this` is bound to the class constructor since we're inside a static method
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const childClassName = Object.getPrototypeOf(this).name;

      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          // TODO convert this into a code snippet suggestion.
          `Failed to apply event of type [${event.type}] for ${childClassName} [${this.getName()}]. Did you forget to add a ${magicUpdateMethodName} method on class ${childClassName}?`,
        ),
      ]);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return this[magicUpdateMethodName](event);
  }

  static fromEventHistory<T extends EventSourcedAggregateRoot>(
    this: typeof EventSourcedAggregateRoot & {
      new (...args: unknown[]): T;
    },
    // TODO Do we need access to metadata here?
    eventHistory: Iterable<DomainEvent>,
    // aggregateId: string?
  ): T | TrueImpactError | null {
    let aggregateRootInstance: T | TrueImpactError | null = null;

    /**
     * This is effectively a reducer loop. We have written it more
     * imperatively to avoid unpacking an Iterable into an array along
     * with the temptation to clone local state unnecessarily.
     *
     * There's not much to lose as this code will never be modified based on
     * previous experience on large CQRS systems.
     */
    for (const event of eventHistory) {
      if (aggregateRootInstance instanceof Error) {
        // short-circuit
        break;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const eventCtorName = Object.getPrototypeOf(event).constructor.name;

      if (!eventCtorName || eventCtorName === 'Object') {
        throw new TrueImpactRuntimeException([
          new TrueImpactError(
            `Failed to identify a data class for event of type [${event.type}]. Perhaps a plain object was passed instead of an instance of DomainEvent.`,
          ),
        ]);
      }

      if (aggregateRootInstance === null) {
        // This is the first event we have seen for the target aggregate root.
        const magicStaticMethodName = `from${eventCtorName}`;

        /**
         * This is extremely subtle. The static method is invoked with a reference to a concrete `EventSourcedAggregateRoot` child class constructor.
         * JavaScript binds `this` to said constructor (not an instance) and then looks for a static method with the magic method name constructed above
         * from the event (e.g., `fromSurveyBegan`).
         */
        if (typeof this[magicStaticMethodName] !== 'function') {
          // `this` is bound to the class constructor since we're inside a static method
          const childClassName = this.name;

          throw new TrueImpactRuntimeException([
            new TrueImpactError(
              `Failed to find a factory function that builds a(n) ${childClassName} from an event history. Did you forget to add a static method named ${magicStaticMethodName}?`,
            ),
          ]);
        }

        /**
         * There's no way to have static type safety here, nor do we need it. We are leveraging `JavaScript`'s dynamic
         * nature behind the scenes to keep the domain classes as readable as possible. The alternative is to have an
         * `apply(event:DomainEvent)` everywhere, switch on the `event.type` and cast the event based on its type
         * in every single case.
         */
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        aggregateRootInstance = this[magicStaticMethodName](event);

        continue;
      }

      aggregateRootInstance = aggregateRootInstance.apply(event);
    }

    return aggregateRootInstance;
  }
}
