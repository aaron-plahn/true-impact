import { plainToInstance } from 'class-transformer';
import { TrueImpactDataExample } from '../../../libs/data-types';
import {
  FlagCompositeIdentifier,
  FlagCompositeIdentifierValuedProp,
} from '../models';

export class FlagCreatedPayload {
  @FlagCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: FlagCompositeIdentifier;

  // TODO ML Text Item DTO
  label: string;

  // TODO ML Text Item DTO
  description: string;
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
      description:
        'is used for flagging tests when you do not care about the specifics of the label itself',
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
