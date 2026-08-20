import { ConfigService } from '@nestjs/config';
import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import {
  getDataSchemaFromClassCtor,
  SimpleSchemaPropertyMetadata,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs/data-types';
import { FLAG_AGGREGATE_TYPE } from '../constants';
import { Flag } from '../models';
import { IFlagCommandRepository } from './flag-command-repository.interface';

export class InMemoryFlagCommandRepository implements IFlagCommandRepository {
  private _nextId = 0;

  private uniqueFields: Set<keyof Flag> = new Set();

  private readonly type = FLAG_AGGREGATE_TYPE;

  constructor(
    private entitiesById: Map<string, Flag> = new Map(),
    private readonly configService: ConfigService,
  ) {
    const schema = getDataSchemaFromClassCtor(Flag);

    const uniqueFields: (keyof Flag)[] = Array.from(
      Object.entries(schema.properties).flatMap(
        ([propertyKey, propertySchema]) => {
          if (
            (propertySchema as SimpleSchemaPropertyMetadata | null)
              ?.mustBeUnique
          ) {
            return propertyKey as keyof Flag;
          }

          return [];
        },
      ),
    );

    uniqueFields.forEach((f) => this.uniqueFields.add(f));
  }

  exists(id: string): Promise<boolean> {
    return Promise.resolve(this.entitiesById.has(id));
  }

  fetchById(id: string): Promise<Flag | null> {
    const searchResult = this.entitiesById.get(id);

    return Promise.resolve(searchResult || null);
  }

  fetchByLabel(label: string): Promise<Flag | null> {
    const searchResult = Array.from(this.entitiesById.values()).find(
      (e) => e.label === label,
    );

    return Promise.resolve(searchResult || null);
  }

  fetchMany(): Promise<Flag[]> {
    const allEntities = Array.from(this.entitiesById.values());

    return Promise.resolve(allEntities);
  }

  create(
    instance: Flag,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const id = this.getNextId();

    instance.id = id;

    instance.revision = 1;

    const uniquenessConstraintsValidationResult =
      this.validateUniquenessConstraints(instance);

    if (uniquenessConstraintsValidationResult instanceof TrueImpactError) {
      return Promise.resolve(uniquenessConstraintsValidationResult);
    }

    this.entitiesById.set(id, instance);

    const result = {
      type: this.type,
      id: instance.id,
      revision: instance.revision.toString(),
    };

    return Promise.resolve(result);
  }

  async createMany(instances: Flag[]): Promise<void> {
    for (const instance of instances) {
      await this.create(instance);
    }
  }

  update(
    instance: Flag,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    if (!this.entitiesById.has(instance.id || '')) {
      const err = new TrueImpactError(
        `You cannot update flag: ${instance.id}, as there is no flag with the given ID.`,
      );

      return Promise.resolve(err);
    }

    const target = this.entitiesById.get(instance.id || '') as Flag;

    Object.assign(target, instance);

    target.revision++;

    return Promise.resolve({
      type: this.type,
      id: instance.id as string,
      revision: target.revision.toString(),
    });
  }

  private getNextId() {
    return (++this._nextId).toString();
  }

  clear() {
    for (const flag of this.entitiesById.values()) {
      this.entitiesById.delete(flag.id as string);
    }
  }

  private fetchWhere({
    field,
    value,
  }: {
    field: keyof Flag;
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

  private validateUniquenessConstraints(
    instance: Flag,
  ): TrueImpactError | this {
    const uniqueFieldViolations = Array.from(this.uniqueFields).flatMap(
      (field: keyof Flag): TrueImpactError[] => {
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
          `One or more uniqueness constraints were violated when attempting to create a TiSystemUser`,
          uniqueFieldViolations,
        ),
      ]);

      return e;
    }

    return this;
  }
}
