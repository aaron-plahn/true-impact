import {
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../error-handling';
import { Entity } from './entity';

interface FromPersistenceDto<TDto = unknown, UInstance = unknown> {
  fromPersistenceDto(
    dto: TDto,
    options?: { shouldValidate?: boolean },
  ): UInstance;
}

const isFromPersistenceDto = <T = unknown>(
  input: unknown,
): input is FromPersistenceDto<T> =>
  input !== null &&
  typeof input !== 'undefined' &&
  typeof (input as FromPersistenceDto).fromPersistenceDto === 'function';

export function UpdateMethod(): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalImplementation = descriptor.value as (
      args: unknown,
    ) => Entity | TrueImpactError;

    descriptor.value = function (...args) {
      if (!(this instanceof Entity)) {
        throw new TrueImpactRuntimeException([
          new TrueImpactError(
            `A method must belong to an Entity class in order to be annotated as an update method`,
          ),
        ]);
      }

      const ctor = target.constructor;

      if (!isFromPersistenceDto(ctor)) {
        throw new TrueImpactRuntimeException([
          new TrueImpactError(
            `Failed to clone instance of ${ctor.name}. You need to define a static fromPersistenceDto on this class`,
          ),
        ]);
      }

      const cloned = ctor.fromPersistenceDto(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.toPersistenceDto() as unknown,
        {
          shouldValidate: true,
        },
      );

      // TODO put a clone method on the entities?
      //   const cloned = this.clone();

      const updated = originalImplementation.apply(cloned, args) as
        Entity | TrueImpactError;

      if (!updated) {
        throw new Error(
          `There is a problem with the implementation of: ${JSON.stringify(
            propertyKey,
          )}. Did you remember to "return this?`,
        );
      }

      if (updated instanceof TrueImpactError) {
        // The update method returned an error

        /**
         * All calls to an update method that fail are the result of a bad
         * user request. We wrap this here as it is used for determining
         * the `HttpStatusCode` in the response mapping.
         */
        return new TrueImpactBadUserInputError([updated]);
      }

      const invariantValidationResult = updated.validateInvariants();

      if (invariantValidationResult instanceof TrueImpactError) {
        // The update method succeeded, but the instance that was built broke an invariant validation rule
        return invariantValidationResult;
      }

      return updated;
    };
  };
}
