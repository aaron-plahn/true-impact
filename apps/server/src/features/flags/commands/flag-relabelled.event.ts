import { plainToInstance } from 'class-transformer';
import { NonEmptyString } from '../../../libs/data-types';
import {
  FlagCompositeIdentifier,
  FlagCompositeIdentifierValuedProp,
} from '../models';

export class FlagRelabelledPayload {
  @FlagCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: FlagCompositeIdentifier;

  @NonEmptyString({
    label: 'new label',
    description: 'updated user-facing label for this flag',
  })
  newLabel: string;
}

export class FlagRelabelled {
  readonly type = 'FLAG_RELABELLED';

  readonly payload: FlagRelabelledPayload;

  constructor({ payload }: { payload: FlagRelabelledPayload }) {
    this.payload = plainToInstance(FlagRelabelledPayload, payload);
  }

  static fromPersistenceDto(dto: FlagRelabelled) {
    return new FlagRelabelled(dto);
  }
}
