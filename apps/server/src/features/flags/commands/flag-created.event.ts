import { plainToInstance } from 'class-transformer';
import {
  EnumeratedType,
  NestedDataType,
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import {
  FlagCompositeIdentifier,
  FlagCompositeIdentifierValuedProp,
} from '../models';

class MultilingualTextItemEventRecord {
  @NonEmptyString({
    label: 'text',
    description: 'plain text in the given language',
  })
  text: string;

  @EnumeratedType(
    {
      en: 'English',
    },
    {
      label: 'language code',
      description: 'standard identifier for a human language',
    },
  )
  languageCode: string;

  translationType: 'original';
}

export class FlagCreatedPayload {
  @FlagCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: FlagCompositeIdentifier;

  @NonEmptyString({
    label: 'label',
    description: 'the user-facing label for this flag',
  })
  label: string;

  @NestedDataType(() => MultilingualTextItemEventRecord, {
    label: 'description',
    description:
      'short text that helps other users understand when and why this flag should be applied to a client',
  })
  description: MultilingualTextItemEventRecord;
}

@TrueImpactDataExample<FlagCreated>({
  example: {
    type: 'FLAG_CREATED',
    payload: {
      aggregateCompositeIdentifier: {
        type: 'FLAG',
        id: '33',
      },
      label: 'my test flag label',
      description: {
        text: 'is used for flagging tests when you do not care about the specifics of the label itself',
        languageCode: 'en',
        translationType: 'original',
      },
    },
  },
})
export class FlagCreated {
  readonly type = 'FLAG_CREATED';

  readonly payload: FlagCreatedPayload;

  constructor({ payload }: { payload: FlagCreatedPayload }) {
    this.payload = plainToInstance(FlagCreatedPayload, payload);
  }

  static fromPersistenceDto(dto: FlagCreated) {
    return new FlagCreated(dto);
  }
}
