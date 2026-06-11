import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs/data-types';
import { IGroupCommandRepository } from '../commands/group-command-repository.interface';
import { GROUP_PROGRAM_AGGREGATE_TYPE } from '../constants';
import { GroupProgram } from '../group-program.aggregate-root';

export class InMemoryGroupProgramCommandRepository implements IGroupCommandRepository {
  private _nextId = 0;

  private uniqueFields: Set<keyof GroupProgram> = new Set();

  private readonly type = GROUP_PROGRAM_AGGREGATE_TYPE;

  constructor(private entitiesById: Map<string, GroupProgram> = new Map()) {}

  fetchById(id: string): Promise<GroupProgram | null> {
    const result = this.entitiesById.get(id) || null;

    return Promise.resolve(result);
  }

  create(
    instance: GroupProgram,
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

  private fetchWhere({
    field,
    value,
  }: {
    field: keyof GroupProgram;
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
    instance: GroupProgram,
  ): TrueImpactError | this {
    const uniqueFieldViolations = Array.from(this.uniqueFields).flatMap(
      (field: keyof GroupProgram): TrueImpactError[] => {
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
