import {
  AggregateRoot,
  NestedDataType,
  TrueImpactError,
} from '../../../libs/data-types';
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
  type = GROUP_PROGRAM_AGGREGATE_TYPE;

  id: string;

  revision: number;

  name: string; // TODO ML Text

  @NestedDataType(() => GroupSession, {
    label: 'sessions',
    description:
      'A list of all current and historical sessions of this group program',
  })
  sessions: GroupSession[];

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
      revision: this.revision,
      sessions: this.sessions.map((s) => s.toPersistenceDto()),
    };
  }
}
