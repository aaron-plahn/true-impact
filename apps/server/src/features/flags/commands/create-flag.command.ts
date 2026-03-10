import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';

@TrueImpactDataExample<CreateFlag>({
  example: {
    label: 'vicious dog',
    description: 'this client has a vicious dog on property',
  },
})
export class CreateFlag {
  static readonly type = 'CREATE_FLAG';

  // TODO `ShortText` ?
  @NonEmptyString({
    label: 'label',
    description: 'short text user-facing label for this flag',
  })
  label: string;

  // languageCodeForLabel

  @NonEmptyString({
    label: 'description',
    description: 'a longer summary of the significance of this tag',
  })
  description: string;

  // languageCodeForDescription
}
