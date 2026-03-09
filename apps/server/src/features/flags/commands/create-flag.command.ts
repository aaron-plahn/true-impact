import { NestedDataType, NonEmptyString } from 'src/libs/data-types';
import { FlagCompositeIdentifier } from '../models';

export class CreateFlag {
  @NestedDataType(() => FlagCompositeIdentifier, {
    label: 'composite ID',
    description: 'system-wide unique identifier for this flag',
  })
  aggregateCompositeIdentifier: FlagCompositeIdentifier;

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
