import { plainToInstance } from 'class-transformer';
import {
  FlagCompositeIdentifier,
  FlagCompositeIdentifierValuedProp,
} from '../models';

export class FlagRelabelledPayload {
  @FlagCompositeIdentifierValuedProp
  aggregateCompositeIdentifier: FlagCompositeIdentifier;

  // TODO ML text support?
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
