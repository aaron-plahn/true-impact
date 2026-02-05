import { TrueImpactError, TrueImpactRuntimeException } from '../error-handling';
import { Entity } from './entity';

interface FromPersistenceDto<TDto = unknown, UInstance = unknown> {
  fromPersistenceDto(dto: TDto): UInstance;
}

interface IPublishable {
  isPublished: boolean;
}

const isPublishable = (input: unknown): input is IPublishable =>
  typeof (input as IPublishable).isPublished === 'boolean';

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

      /**
       * TODO We should have a better way of dealing with this. Maybe we want a decorator
       * @Publishable()
       * @AggregateRoot('survey')
       * class Survey extends Entity<SurveyPersistenceDto>{ ... }
       */
      // TODO why do we still need the assertion after the typeguard? Can we make `this` unknown isntead of any?
      if (isPublishable(this) && (this as IPublishable).isPublished) {
        return new TrueImpactError(
          `You cannot edit ${ctor.name.toLowerCase()} [${(this as Entity).getName()}] as it has been published for public use.`,
        );
      }

      const cloned = ctor.fromPersistenceDto(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.toPersistenceDto() as unknown,
      );

      // TODO put a clone method on the entities?
      //   const cloned = this.clone();

      const updated = originalImplementation.apply(cloned, args) as
        | Entity
        | TrueImpactError;

      if (!updated) {
        throw new Error(
          `There is a problem with the implementation of: ${JSON.stringify(
            propertyKey,
          )}. Did you remember to "return this?`,
        );
      }

      if (updated instanceof TrueImpactError) {
        // The update method returned an error
        return updated;
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
