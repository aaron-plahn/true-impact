import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import {
  getDataSchemaFromClassCtor,
  SimpleSchemaPropertyMetadata,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs/data-types';
import { SURVEY_AGGREGATE_TYPE } from '../constants';
import { Survey } from '../survey-management';
import { ISurveyCommandRepository } from './survey-command-repository.interface';

export class InMemorySurveyCommandRepository implements ISurveyCommandRepository {
  private _nextId = 0;

  private uniqueFields: Set<keyof Survey> = new Set();

  private readonly type = SURVEY_AGGREGATE_TYPE;

  constructor(private entitiesById: Map<string, Survey> = new Map()) {
    const schema = getDataSchemaFromClassCtor(Survey);

    const uniqueFields: (keyof Survey)[] = Array.from(
      Object.entries(schema.properties),
    ).flatMap(([propertyKey, propertySchema]) => {
      if (
        (propertySchema as SimpleSchemaPropertyMetadata | null)?.mustBeUnique
      ) {
        return [propertyKey as keyof Survey];
      }

      return [];
    });

    uniqueFields.forEach((f) => {
      this.uniqueFields.add(f);
    });
  }

  exists(id: string): Promise<boolean> {
    return Promise.resolve(this.entitiesById.has(id));
  }

  fetchById(id: string): Promise<Survey | null> {
    return Promise.resolve(this.entitiesById.get(id) || null);
  }

  fetchMany(): Promise<Survey[]> {
    return Promise.resolve(Array.from(this.entitiesById.values()));
  }

  create(
    instance: Survey,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    if (this.entitiesById.has(instance.id)) {
      return Promise.resolve(
        new TrueImpactError(
          `Unique constraint [id] violated. There is already a survey with the ID: ${instance.id}`,
        ),
      );
    }

    const uniquenessConstraintsValidationResult =
      this.validateUniquenessConstraints(instance);

    if (uniquenessConstraintsValidationResult instanceof TrueImpactError) {
      return Promise.resolve(uniquenessConstraintsValidationResult);
    }

    instance.revision = 1;

    this.entitiesById.set(instance.id, instance);

    const result = {
      type: this.type,
      id: instance.id,
      revision: instance.revision.toString(),
    };

    return Promise.resolve(result);
  }

  async createMany(instances: Survey[]): Promise<void> {
    for (const instance of instances) {
      await this.create(instance);
    }
  }

  revokeAccess(
    id: string,
    hashedAccessCode: string,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const target = this.entitiesById.get(id);

    if (!target) {
      return Promise.resolve(
        new TrueImpactError(`Failed to revoke access to unknown survey: ${id}`),
      );
    }

    target.revokeAccessdCode(hashedAccessCode);

    target.revision += 1;

    this.entitiesById.set(id, target);

    return Promise.resolve({
      type: this.type,
      id,
      revision: target.revision.toString(),
    });
  }

  update(
    instance: Survey,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const uniquenessConstraintsValidationResult =
      this.validateUniquenessConstraints(instance);

    if (uniquenessConstraintsValidationResult instanceof TrueImpactError) {
      return Promise.resolve(uniquenessConstraintsValidationResult);
    }

    const { id, revision: revisonNumber } = instance.toPersistenceDto();

    if (!this.entitiesById.has(id)) {
      return Promise.resolve(
        new TrueImpactError(
          `Failed to update survey [${id}], as it does not exist.`,
        ),
      );
    }

    const existingEntity = this.entitiesById.get(id) as Survey;

    if (existingEntity.revision !== revisonNumber) {
      const optimisticConcurrencyError = new TrueImpactError(
        `Failed to update ${SURVEY_AGGREGATE_TYPE}/${existingEntity.getId()} from revision [${existingEntity.revision}] as it was been modified by another user during validation.`,
      );

      return Promise.resolve(optimisticConcurrencyError);
    }

    instance.revision++;

    this.entitiesById.set(id, instance);

    return Promise.resolve({
      id,
      // pull this from the entity?
      type: SURVEY_AGGREGATE_TYPE,
      revision: existingEntity.revision.toString(),
    });
  }

  private validateUniquenessConstraints(
    instance: Survey,
  ): TrueImpactError | this {
    const uniqueFieldViolations = Array.from(this.uniqueFields).flatMap(
      (field: keyof Survey): TrueImpactError[] => {
        const newValue = instance[field];

        const collisions = this.fetchWhere({
          field,
          //   @ts-expect-error We should restrict which fields can be used in where filters, but this is a temporary implementation anyway
          value: instance[field],
          // it's not a collision if it's already in use
          // we'll have a better way of doing this in the production DB implementation
        }).filter(({ id }) => id !== instance.id);

        return collisions.length > 0
          ? [
              new TrueImpactError(
                `Uniqueness constraint violated for field [${field}]. The value [${newValue as unknown as string}] is already in use.`,
              ),
            ]
          : [];
      },
    );

    if (uniqueFieldViolations.length > 0) {
      const e = new TrueImpactBadUserInputError([
        new TrueImpactError(
          `One or more uniqueness constraints were violated when attempting to create a survey`,
          uniqueFieldViolations,
        ),
      ]);

      return e;
    }

    return this;
  }

  private fetchWhere({
    field,
    value,
  }: {
    field: keyof Survey;
    value: string | number | boolean;
  }) {
    if (field.includes('.')) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Searching nested fields in an in-memory repository is not yet supported.`,
        ),
      ]);
    }

    return Array.from(this.entitiesById.values()).filter((instance) => {
      if (!(field in instance)) {
        return false;
      }

      const actualValueForThisInstance = instance[field];

      return actualValueForThisInstance === value;
    });
  }

  private getNextId() {
    return (++this._nextId).toString();
  }

  clear() {
    this.entitiesById = new Map();
  }
}
