import { NestedDataType, NonEmptyString } from '../../../libs/data-types';
import { GroupProgram } from '../domain/group-program.aggregate-root';
import { GroupSessionViewModel } from './group-session.view-model';

export class GroupProgramViewModel {
  @NonEmptyString({
    label: 'id',
    description: 'unique system identifier for this group program',
  })
  id: string;

  @NonEmptyString({
    label: 'name',
    description: 'public-facing name of this group program (and its sessions)',
  })
  name: string;

  @NonEmptyString({
    label: 'revision',
    description: 'tracks edits to this group program',
  })
  revision: string;

  @NestedDataType(() => GroupSessionViewModel, {
    label: 'sessions',
    description: 'an ordered list of the sessions of this group program',
  })
  sessions: GroupSessionViewModel[];

  constructor({
    id,
    name,
    revision,
    sessions,
  }: {
    id: string;
    name: string;
    revision: string;
    sessions: GroupSessionViewModel[];
  }) {
    this.id = id;

    this.name = name;

    this.revision = revision;

    this.sessions = sessions;
  }

  static fromDomainModel(domainModel: GroupProgram) {
    const { id, name, revision, sessions: domainSessions } = domainModel;

    const sessions = domainSessions.map((ds) =>
      GroupSessionViewModel.fromDomainModel(ds),
    );

    return new GroupProgramViewModel({
      id,
      name,
      revision: revision.toString(),
      sessions,
    });
  }
}
