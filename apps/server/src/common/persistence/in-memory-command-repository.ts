/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import {
  AggregateRoot,
  Ctor,
  getDataSchemaFromClassCtor,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';

interface BasePersistenceDto {
  id: string;
  revision: number;
}

export class InMemoryCommandRepository<
  TDto extends BasePersistenceDto,
  T extends AggregateRoot<TDto>,
> {
  private _nextId = 0;

  private instanceCtor: Ctor<T> & { type: string };

  private uniqueFields: Set<string> = new Set();

  // collection ?
  private type: string;

  constructor(
    C: Ctor<T> & { type: string },
    private readonly entititesById: Map<string, T> = new Map(),
  ) {
    this.instanceCtor = C;

    this.type = this.instanceCtor.type;

    const schema = getDataSchemaFromClassCtor(C);

    const uniqueFields: string[] = Array.from(
      Object.entries(schema.properties),
    ).flatMap(([propertyKey, propertySchema]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (propertySchema?.mustBeUnique) {
        return [propertyKey];
      }

      return [];
    });

    uniqueFields.forEach((f) => {
      this.uniqueFields.add(f);
    });
  }

  async exists(id: string): Promise<boolean> {
    return Promise.resolve(this.entititesById.has(id));
  }

  async fetchById(id: string): Promise<T | null> {
    const result = this.entititesById.get(id) || null;

    return Promise.resolve(result);
  }

  fetchMany(): Promise<T[]> {
    return Promise.resolve(Array.from(this.entititesById.values()));
  }

  /**
   * This is not meant to define a public API for user-defined filters at this point.
   */
  private fetchWhere({
    field,
    value,
  }: {
    field: string;
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

  async create(
    instance: T,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    // How should we handle this?
    const id = this.getNextId();

    if (this.entititesById.has(id)) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Unique key constraint violated (id): ${id} when creating a T.`,
        ),
      ]);
    }

    instance.id = id;

    const uniqueFieldViolations = Array.from(this.uniqueFields).flatMap(
      (field: string): TrueImpactError[] => {
        const newValue = instance[field];

        const collisions = this.fetchWhere({
          field,
          value: instance[field],
        });

        return collisions.length > 0
          ? [
              new TrueImpactError(
                `Uniqueness constraint violated for field [${field}]. The value [${newValue}] is already in use.`,
              ),
            ]
          : [];
      },
    );

    if (uniqueFieldViolations.length > 0) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `One or more uniqueness constraints were violated when attempting to create a [${this.instanceCtor.name}]`,
          uniqueFieldViolations,
        ),
      ]);
    }

    this.entititesById.set(id, instance);

    return Promise.resolve({
      id,
      revision: instance.revision.toString(),
      type: this.type,
    });
  }

  createMany(_instances: T[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  update(
    instance: T,
  ): Promise<{ id: string; revision: string; type: string } | TrueImpactError> {
    const { id, revision: revisonNumber } = instance.toPersistenceDto();

    if (!this.entititesById.has(id)) {
      return Promise.resolve(
        new TrueImpactError(
          `Failed to update entity ${this.instanceCtor.name} [${id}], as it does not exist.`,
        ),
      );
    }

    const existingEntity = this.entititesById.get(id) as T;

    if (existingEntity.revision !== revisonNumber) {
      const optimisticConcurrencyError = new TrueImpactError(
        `Failed to update ${this.type}/${existingEntity.getId()} from revision [${existingEntity.revision}] as it was been modified by another user during validation.`,
      );

      return Promise.resolve(optimisticConcurrencyError);
    }

    instance.revision++;

    this.entititesById.set(id, instance);

    return Promise.resolve({
      id,
      // pull this from the entity?
      type: this.type,
      revision: existingEntity.revision.toString(),
    });
  }

  clear() {
    for (const id of this.entititesById.keys()) {
      this.entititesById.delete(id);
    }
  }

  private getNextId() {
    return (++this._nextId).toString();
  }
}
