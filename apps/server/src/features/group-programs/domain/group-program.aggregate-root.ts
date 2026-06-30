import { IDomainEvent } from '../../../libs/cqrs-es';
import {
  AggregateRoot,
  Entity,
  NestedDataType,
  NonEmptyString,
  NonNegativeInteger,
  RawObject,
  ResourceNotFoundError,
  TrueImpactBadUserInputError,
  TrueImpactError,
  UpdateMethod,
} from '../../../libs/data-types';
import { CreateGroupProgram, GroupProgramScheduled } from './commands';
import { GroupProgramCreated } from './commands/create-group-program/group-program-created.event';
import { GROUP_PROGRAM_AGGREGATE_TYPE } from './constants';
import { GroupProgramCompositeIdentifier } from './group-program.composite-identifier';
import { GroupSessionLocationDto } from './group-session-location.value-object';
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

  eventHistory: IDomainEvent[];
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
    isArray: true,
    isOptional: true, // i.e., can be empty
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

  getNextSessionId(): string {
    return (this.sessions.length + 1).toString();
  }

  toPersistenceDto(): GroupProgramPersistenceDto {
    return {
      id: this.id,
      name: this.name,
      sessions: this.sessions.map((s) => s.toPersistenceDto()),
      revision: this.eventHistory.length,
      eventHistory: this.eventHistory,
    };
  }

  getSessionById(sessionId: string): GroupSession | null {
    return this.sessions.find((s) => s.id === sessionId) || null;
  }

  getCompositeIdentifier(): GroupProgramCompositeIdentifier {
    return {
      type: GROUP_PROGRAM_AGGREGATE_TYPE,
      id: this.id,
    };
  }

  @UpdateMethod()
  scheduleSession({
    date,
    location,
  }: {
    date: string;
    location: GroupSessionLocationDto;
  }): GroupProgram | TrueImpactError {
    const sessionBuildResult = GroupSession.schedule({
      id: this.getNextSessionId(),
      date,
      location,
    });

    if (sessionBuildResult instanceof Error) {
      return sessionBuildResult;
    }

    this.sessions.push(sessionBuildResult);

    return this.apply(
      new GroupProgramScheduled({
        payload: {
          aggregateCompositeIdentifier: {
            id: this.id,
            type: GROUP_PROGRAM_AGGREGATE_TYPE,
          },
          date,
          sessionId: sessionBuildResult.id,
        },
      }),
    );
  }

  makeNote({
    sessionId,
    note,
  }: {
    sessionId: string;
    note: { text: string; languageCode: string };
  }): GroupProgram | TrueImpactError {
    const { languageCode } = note;

    // TODO include all languages relevant to the tenant
    if (languageCode !== 'en') {
      return new TrueImpactError(
        `You cannot make a note about group program: ${this.getName()} in the language: ${languageCode}, as this language is not supported by the system.`,
      );
    }

    const targetSession = this.getSessionById(sessionId);

    if (!targetSession) {
      return new TrueImpactError(
        `You cannot make a note about an interaction at group session: ${sessionId} as there is no such session of group program ${this.getName()}`,
      );
    }

    const updateResult = targetSession.makeNoteAboutInteraction(note);

    if (updateResult instanceof Error) {
      return updateResult;
    }

    /**
     * Note that the nested update method executes a side effect that mutates
     * the target session.
     */
    return this;
  }

  @UpdateMethod()
  recordObservationByType({
    sessionId,
    interactionType,
  }: {
    sessionId: string;
    interactionType: string;
  }): GroupProgram | TrueImpactError {
    const targetSession = this.getSessionById(sessionId);

    if (!targetSession) {
      return new ResourceNotFoundError(this.getCompositeIdentifier());
    }

    const updateResult = targetSession.recordObservationByType(interactionType);

    if (updateResult instanceof Error) {
      return updateResult;
    }

    /**
     * Note that the nested update method executes a side effect that updates the target session.
     */
    return this;
  }

  @UpdateMethod()
  classifyObservation({
    sessionId,
    observationId,
    interactionType,
  }: {
    sessionId: string;
    observationId: string;
    interactionType: string;
  }): GroupProgram | TrueImpactError {
    const targetSession = this.getSessionById(sessionId);

    if (!targetSession) {
      return new TrueImpactError(
        `You cannot update session ${sessionId} of group program: ${this.getName()} as there is no such session`,
      );
    }

    const updateResult = targetSession.classifyInteraction({
      observationId,
      interactionType,
    });

    if (updateResult instanceof Error) {
      return updateResult;
    }

    return this;
  }

  apply(event: IDomainEvent): GroupProgram | TrueImpactError {
    if (event.type === 'GROUP_PROGRAM_SESSION_SCHEDULED') {
      /**
       * This might not be the pattern we want.
       */
      this.eventHistory.push(event);
    }

    return this;
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

  static fromPersistenceDto(
    {
      id,
      sessions: sessionDtos,
      name,
      eventHistory,
    }: GroupProgramPersistenceDto,
    buildOptions: { shouldValidate?: boolean } = {},
  ): Entity | TrueImpactError {
    const sessions: GroupSession[] = [];

    const sessionErrors: TrueImpactError[] = [];

    sessionDtos.forEach((sessionDto) => {
      const buildResult = GroupSession.fromPersistenceDto(
        sessionDto,
        buildOptions,
      );

      if (buildResult instanceof Error) {
        sessionErrors.push(buildResult);
      } else {
        sessions.push(buildResult);
      }
    });

    if (sessionErrors.length > 0) {
      return new TrueImpactError(
        `Failed to build a group program due to invalid existing session data.`,
        sessionErrors,
      );
    }

    const instance = new GroupProgram({
      id,
      name,
      sessions,
      eventHistory,
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
