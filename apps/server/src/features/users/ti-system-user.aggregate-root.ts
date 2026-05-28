import { FullName, FullNameDto } from 'src/common/full-name';
import { AggregateRoot, Entity, TrueImpactError } from 'src/libs/data-types';
import { TI_SYSTEM_USER_AGGREGATE_TYPE } from './constants';

class TiSystemUserPersistenceDto {
  id: string;
  revision: number;
  role: string;
  fullName: FullNameDto;
}

export class TiSystemUser extends AggregateRoot<TiSystemUserPersistenceDto> {
  static readonly type = TI_SYSTEM_USER_AGGREGATE_TYPE;

  id: string;

  revision: number;

  fullName: FullName;

  // TODO enum?
  role: string;

  constructor({
    id,
    revision,
    fullName,
    role,
  }: {
    id: string;
    revision: number;
    fullName: FullName;
    role: string;
  }) {
    super();

    this.id = id;

    this.revision = revision;

    this.fullName = fullName;

    this.role = role;
  }

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getName(): string {
    return this.fullName.toString();
  }

  toPersistenceDto(): TiSystemUserPersistenceDto {
    return {
      id: this.id,
      revision: this.revision,
      role: this.role,
      fullName: this.fullName.toDto(),
    };
  }

  static fromPersistenceDto(
    dto: TiSystemUserPersistenceDto,
    buildOptions?: { shouldValidate?: boolean },
  ): Entity | TrueImpactError {
    const { id, revision, role, fullName: fullNameDto } = dto;

    const instance = new TiSystemUser({
      id,
      revision,
      role,
      fullName: FullName.fromDto(fullNameDto),
    });

    return buildOptions?.shouldValidate
      ? instance.validateInvariants()
      : instance;
  }
}
