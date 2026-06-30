import { ConfigService } from '@nestjs/config';
import { PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import {
  DeepPartial,
  getDataSchemaFromClassCtor,
  SimpleSchemaPropertyMetadata,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../libs/data-types';
import { USER_AGGREGATE_TYPE } from '../constants';
import { UserRole } from '../types';
import { User } from '../user.aggregate-root';
import { IUserCommandRepository } from './user-command-repository.interface';

export class InMemoryUserCommandRepository implements IUserCommandRepository {
  private _nextId = 0;

  private uniqueFields: Set<keyof User> = new Set();

  private readonly type = USER_AGGREGATE_TYPE;

  constructor(
    private entitiesById: Map<string, User> = new Map(),
    private readonly configService: ConfigService,
  ) {
    const schema = getDataSchemaFromClassCtor(User);

    // @ts-expect-error What's going on here?
    const uniqueFields: (keyof User)[] = Array.from(
      Object.entries(schema.properties),
    ).flatMap(([propertyKey, propertySchema]) => {
      if (
        (propertySchema as SimpleSchemaPropertyMetadata | null)?.mustBeUnique
      ) {
        return [propertyKey as keyof UserRole];
      }

      return [];
    });

    uniqueFields.forEach((f) => {
      this.uniqueFields.add(f);
    });
  }

  count(): Promise<number> {
    const result = this.entitiesById.size;

    return Promise.resolve(result);
  }

  async isEmpty(): Promise<boolean> {
    const count = await this.count();

    return count === 0;
  }

  fetchByCredentials(credentials: {
    username: string;
    hashedPassword: string;
  }): Promise<User | null> {
    const searchResult = Array.from(this.entitiesById.values()).find((user) => {
      return (
        user.username === credentials.username &&
        user.hashedPassword === credentials.hashedPassword &&
        user.isActive
      );
    });

    return Promise.resolve(searchResult || null);
  }

  fetchMany(): Promise<User[] | TrueImpactError> {
    const instances = Array.from(this.entitiesById.values());

    return Promise.resolve(instances);
  }

  create(
    instance: User,
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

  async createMany(instances: User[]): Promise<void> {
    for (const instance of instances) {
      await this.create(instance);
    }
  }

  // We may want more specific update methods at some point
  update(
    intance: DeepPartial<User> & Pick<User, 'id'>,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    if (!this.entitiesById.has(intance.id)) {
      const err = new TrueImpactError(
        `You cannot update user: ${intance.id}, as there is no user with the given ID.`,
      );

      return Promise.resolve(err);
    }

    const target = this.entitiesById.get(intance.id) as User;

    Object.assign(target, intance);

    target.revision++;

    return Promise.resolve({
      type: this.type,
      id: intance.id,
      revision: target.revision.toString(),
    });
  }

  async fetchById(id: string): Promise<User | null> {
    const result = this.entitiesById.get(id) || null;

    if (!result || !result.isActive) {
      return Promise.resolve(null);
    }

    return Promise.resolve(result);
  }

  private fetchWhere({
    field,
    value,
  }: {
    field: keyof User;
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
    instance: User,
  ): TrueImpactError | this {
    const uniqueFieldViolations = Array.from(this.uniqueFields).flatMap(
      (field: keyof User): TrueImpactError[] => {
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
    const defaultAdminUsername =
      this.configService.get<string | null>('SYSTEM_ADMIN_USERNAME') ||
      '<NONE>';

    for (const user of this.entitiesById.values()) {
      if (user.username !== defaultAdminUsername) {
        this.entitiesById.delete(user.id);
      }
    }
  }
}
