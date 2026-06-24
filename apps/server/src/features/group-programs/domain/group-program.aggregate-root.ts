import { IDomainEvent } from '../../../libs/cqrs-es';
import {
  AggregateRoot,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  RawObject,
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../libs/data-types';
import { CreateGroupProgram } from './commands';
import { GroupProgramCreated } from './commands/create-group-program/group-program-created.event';
import { GROUP_PROGRAM_AGGREGATE_TYPE } from './constants';
import {
  GroupSession,
  GroupSessionPersistenceDto,
} from './group-session.entity';

// TODO Can we avoid this?
export class GroupProgramPersistenceDto {
  id: string;

  name: string;

  revision: number;

  sessions: GroupSessionPersistenceDto[];
}

export class GroupProgram extends AggregateRoot {
  @NonEmptyString({
    label: 'type',
    description: GROUP_PROGRAM_AGGREGATE_TYPE,
  })
  type = GROUP_PROGRAM_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'unique system identifier for this group program',
  })
  id: string;

  // note that this is generated internally and detailed validation is not required
  @RawObject({
    label: 'event history',
    description: 'audit log of historical edits to this group program',
    isArray: true,
  })
  eventHistory: IDomainEvent[];

  @NonNegativeInteger({
    label: 'revision',
    description:
      'tracks state of this group program across all historical edits',
  })
  // Can we make this a getter? this.eventHistory.length
  revision: number;

  @NonEmptyString({
    label: 'name',
    description: 'the public-facing name of this group program',
    mustBeUnique: true,
  })
  name: string; // TODO ML Text

  @NestedDataType(() => GroupSession, {
    label: 'sessions',
    description:
      'A list of all current and historical sessions of this group program',
  })
  sessions: GroupSession[];

  constructor({
    id,
    name,
    sessions,
    eventHistory,
  }: {
    id: string;
    name: string;
    sessions: GroupSession[];
    eventHistory: IDomainEvent[];
  }) {
    super();

    this.id = id;

    this.revision = eventHistory.length;

    this.name = name;

    this.sessions = sessions;

    this.eventHistory = eventHistory;
  }

  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    // TODO this should happen automatically based on the `@NestedDataType` \ schema
    const sessionValidationErrors = this.sessions.flatMap((s) => {
      const nestedResult = s.validateInvariants();

      if (nestedResult instanceof Error) {
        return [nestedResult];
      }

      return [];
    });

    allErrors.push(...sessionValidationErrors);

    return allErrors;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  toPersistenceDto(): GroupProgramPersistenceDto {
    return {
      id: this.id,
      name: this.name,
      sessions: this.sessions.map((s) => s.toPersistenceDto()),
      revision: this.eventHistory.length,
    };
  }

  static fromUserRequest({
    aggregateCompositeIdentifier: { id },
    name,
  }: CreateGroupProgram & {
    aggregateCompositeIdentifier: { id: string };
  }): GroupProgram | TrueImpactBadUserInputError {
    const buildResult = new GroupProgram({
      id,
      sessions: [],
      name,
      eventHistory: [
        new GroupProgramCreated({
          payload: {
            aggregateCompositeIdentifier: {
              // TODO we should omit this
              type: GROUP_PROGRAM_AGGREGATE_TYPE,
              id: id,
            },
            name,
          },
        }),
      ],
    });

    return buildResult.validateInvariants();
  }
}
