import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';

@TrueImpactDataExample<CreateGroupProgram>({
  example: {
    name: 'After School Sports',
  },
})
export class CreateGroupProgram {
  static readonly type = 'CREATE_GROUP_PROGRAM';

  @NonEmptyString({
    label: 'name',
    description: 'the name of this group program',
  })
  name: string;
}
