import { NonEmptyString } from 'src/libs/data-types';

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
}
