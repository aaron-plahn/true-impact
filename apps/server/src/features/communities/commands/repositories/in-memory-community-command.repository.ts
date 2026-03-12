import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import {
  getDataSchemaFromClassCtor,
  SimpleSchemaPropertyMetadata,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../../libs/data-types';
import { COMMUNITY_AGGREGATE_TYPE } from '../../constants';
import { Community } from '../../models';
import { ICommunityCommandRepository } from './community-command-repository.interface';

export class InMemoryCommunityCommandRepository implements ICommunityCommandRepository {
  private _nextId = 0;

  private uniqueFields: Set<keyof Community> = new Set();

  private readonly type = COMMUNITY_AGGREGATE_TYPE;

  constructor(private entititesById: Map<string, Community> = new Map()) {
    const schema = getDataSchemaFromClassCtor(Community);

    const uniqueFields: (keyof Community)[] = Array.from(
      Object.entries(schema.properties),
    ).flatMap(([propertyKey, propertySchema]) => {
      if (
        (propertySchema as SimpleSchemaPropertyMetadata | null)?.mustBeUnique
      ) {
        return [propertyKey as keyof Community];
      }

      return [];
    });

    uniqueFields.forEach((f) => {
      this.uniqueFields.add(f);
    });
  }

  async exists(id: string): Promise<boolean> {
    const result = this.entititesById.has(id);

    return Promise.resolve(result);
  }

  async fetchById(id: string): Promise<Community | null> {
    const result = this.entititesById.get(id) || null;

    return Promise.resolve(result);
  }

  fetchMany(): Promise<Community[]> {
    return Promise.resolve(Array.from(this.entititesById.values()));
  }

  async create(
    instance: Community,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const entitiesWithTheSameName = Array.from(
      this.entititesById.values(),
    ).flatMap((e): TrueImpactError[] =>
      e.getName() === instance.getName()
        ? [
            new TrueImpactError(
              `You cannot create community [${instance.getName()}], as there is already a community [${e.bandNumber}] with this name`,
            ),
          ]
        : [],
    );

    if (entitiesWithTheSameName.length > 0) {
      return new TrueImpactError(
        `Failed to create community due to name collisions.`,
        entitiesWithTheSameName,
      );
    }

    const id = this.getNextId();

    if (this.entititesById.has(id)) {
      return new TrueImpactError(
        `Unique key constraint violated (id): ${id} when creating a community.`,
      );
    }

    instance.id = id;

    instance.revision = 1;

    this.entititesById.set(id, instance);

    return Promise.resolve({
      id,
      type: COMMUNITY_AGGREGATE_TYPE,
      revision: 'a',
    });
  }

  update(
    instance: Community,
  ): Promise<{ id: string; revision: string; type: string } | TrueImpactError> {
    const uniquenessConstraintsValidationResult =
      this.validateUniquenessConstraints(instance);

    if (uniquenessConstraintsValidationResult instanceof TrueImpactError) {
      return Promise.resolve(uniquenessConstraintsValidationResult);
    }

    const { id, revision: revisonNumber } = instance.toPersistenceDto();

    if (!this.entititesById.has(id)) {
      return Promise.resolve(
        new TrueImpactError(
          `Failed to update community [${id}], as it does not exist.`,
        ),
      );
    }

    const existingEntity = this.entititesById.get(id) as Community;

    if (existingEntity.revision !== revisonNumber) {
      const optimisticConcurrencyError = new TrueImpactError(
        `Failed to update ${COMMUNITY_AGGREGATE_TYPE}/${existingEntity.getId()} from revision [${existingEntity.revision}] as it was been modified by another user during validation.`,
      );

      return Promise.resolve(optimisticConcurrencyError);
    }

    instance.revision++;

    this.entititesById.set(id, instance);

    return Promise.resolve({
      id,
      // pull this from the entity?
      type: COMMUNITY_AGGREGATE_TYPE,
      revision: existingEntity.revision.toString(),
    });
  }

  private validateUniquenessConstraints(
    instance: Community,
  ): TrueImpactError | this {
    const uniqueFieldViolations = Array.from(this.uniqueFields).flatMap(
      (field: keyof Community): TrueImpactError[] => {
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
          `One or more uniqueness constraints were violated when attempting to create a community`,
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
    field: keyof Community;
    value: string | number | boolean;
  }) {
    if (field.includes('.')) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Searching nested fields in an in-memory repository is not yet supported.`,
        ),
      ]);
    }

    return Array.from(this.entititesById.values()).filter((instance) => {
      if (!(field in instance)) {
        return false;
      }

      const actualValueForThisInstance = instance[field];

      return actualValueForThisInstance === value;
    });
  }

  createMany(_instances: Community[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  clear() {
    this.entititesById = new Map();
  }

  private getNextId() {
    return (++this._nextId).toString();
  }
}
