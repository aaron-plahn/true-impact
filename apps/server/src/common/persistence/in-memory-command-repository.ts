/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Ctor,
  Entity,
  getDataSchemaFromClassCtor,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs';

export class InMemoryCommandRepository<T extends Entity> {
  private _nextId = 0;

  private instanceCtor: Ctor<T>;

  private uniqueFields: Set<string> = new Set();

  constructor(
    C: Ctor<T>,
    private readonly entititesById: Map<string, T> = new Map(),
  ) {
    this.instanceCtor = C;

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

  async fetchById(id: string): Promise<T | null> {
    const result = this.entititesById.get(id) || null;

    return Promise.resolve(result);
  }

  fetchMany(): Promise<T[]> {
    throw new Error('Method not implemented.');
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

  async create(instance: T): Promise<string | TrueImpactError> {
    // How should we handle this?
    const id = this.getNextId();

    if (this.entititesById.has(id)) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Unique key constraint violated (id): ${id} when creating a T.`,
        ),
      ]);
    }

    const idSetResult = instance.setInitialId(id);

    if (idSetResult instanceof TrueImpactError) {
      return idSetResult;
    }

    const uniqueFieldViolations = Array.from(this.uniqueFields).flatMap(
      (field: string): TrueImpactError[] => {
        const newValue = idSetResult[field];

        const collisions = this.fetchWhere({
          field,
          value: idSetResult[field],
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

    this.entititesById.set(id, idSetResult as T);

    return Promise.resolve(id);
  }

  createMany(_instances: T[]): Promise<void> {
    throw new Error('Method not implemented.');
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
