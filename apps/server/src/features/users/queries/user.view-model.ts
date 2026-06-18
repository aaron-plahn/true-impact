import { FullName, FullNameDto } from '../../../common/full-name';
import { NestedDataType, NonEmptyString } from '../../../libs/data-types';
import { User } from '../user.aggregate-root';

export class UserViewModelClientDto {
  @NonEmptyString({
    label: 'ID',
    description: 'internal system identifier for this user',
  })
  id: string;

  @NonEmptyString({
    label: 'revision',
    description: `tracks historical modifications to this user's data`,
  })
  revision: string;

  @NonEmptyString({
    label: 'username',
    description: 'uniquely identifies the user',
  })
  username: string;

  @NestedDataType(() => FullName, {
    label: 'full name',
    description: `user's full given name`,
  })
  fullName: FullNameDto;

  @NonEmptyString({
    label: 'role',
    description:
      'a role gives the user course-grained permissions to execute read and write actions in the system',
  })
  role: string;
}

export class UserViewModel {
  id: string;

  revision: string;

  username: string;

  fullName: FullName;

  role: string;

  constructor({
    id,
    revision,
    username,
    fullName,
    role,
  }: {
    id: string;
    revision: string;
    username: string;
    fullName: FullName;
    role: string;
  }) {
    this.id = id;

    this.revision = revision;

    this.username = username;

    this.fullName = fullName;

    this.role = role;
  }

  toClientDto(): UserViewModelClientDto {
    return {
      id: this.id,
      revision: this.revision,
      username: this.username,
      fullName: this.fullName.toDto(),
      role: this.role,
    };
  }

  static fromDomainModel(domainModel: User): UserViewModel {
    const { id, revision, username, fullName, role } = domainModel;

    return new UserViewModel({
      id,
      revision: revision.toString(),
      username,
      fullName,
      role,
    });
  }
}
