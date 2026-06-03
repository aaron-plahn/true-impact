import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import {
  DeepPartial,
  getDataSchemaFromClassCtor,
  SimpleSchemaPropertyMetadata,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs/data-types';
import { TI_SYSTEM_USER_AGGREGATE_TYPE } from '../constants';
import { TiSystemUser } from '../ti-system-user.aggregate-root';
import { TiUserRole } from '../types';
import { ITiSystemUserCommandRepository } from './ti-system-user-command-repository.interface';

export class InMemoryTiSystemUserCommandRepository implements ITiSystemUserCommandRepository {
  private _nextId = 0;

  private uniqueFields: Set<keyof TiSystemUser> = new Set();

  private readonly type = TI_SYSTEM_USER_AGGREGATE_TYPE;

  constructor(private entitiesById: Map<string, TiSystemUser> = new Map()) {
    const schema = getDataSchemaFromClassCtor(TiSystemUser);

    // @ts-expect-error What's going on here?
    const uniqueFields: (keyof TiSystemUser)[] = Array.from(
      Object.entries(schema.properties),
    ).flatMap(([propertyKey, propertySchema]) => {
      if (
        (propertySchema as SimpleSchemaPropertyMetadata | null)?.mustBeUnique
      ) {
        return [propertyKey as keyof TiUserRole];
      }

      return [];
    });

    uniqueFields.forEach((f) => {
      this.uniqueFields.add(f);
    });
  }

  fetchMany(): Promise<TiSystemUser[] | TrueImpactError> {
    const instances = Array.from(this.entitiesById.values());

    return Promise.resolve(instances);
  }

  create(
    instance: TiSystemUser,
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

  async createMany(instances: TiSystemUser[]): Promise<void> {
    for (const instance of instances) {
      await this.create(instance);
    }
  }

  // We may want more specific update methods at some point
  update(
    intance: DeepPartial<TiSystemUser> & Pick<TiSystemUser, 'id'>,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    if (!this.entitiesById.has(intance.id)) {
      const err = new TrueImpactError(
        `You cannot update user: ${intance.id}, as there is no user with the given ID.`,
      );

      return Promise.resolve(err);
    }

    const target = this.entitiesById.get(intance.id) as TiSystemUser;

    Object.assign(target, intance);

    target.revision++;

    return Promise.resolve({
      type: this.type,
      id: intance.id,
      revision: target.revision.toString(),
    });
  }

  async fetchById(id: string): Promise<TiSystemUser | null> {
    const result = this.entitiesById.get(id) || null;

    return Promise.resolve(result);
  }

  private fetchWhere({
    field,
    value,
  }: {
    field: keyof TiSystemUser;
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
    instance: TiSystemUser,
  ): TrueImpactError | this {
    const uniqueFieldViolations = Array.from(this.uniqueFields).flatMap(
      (field: keyof TiSystemUser): TrueImpactError[] => {
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

  private getNextId() {
    return (++this._nextId).toString();
  }

  clear() {
    this.entitiesById = new Map();
  }
}
