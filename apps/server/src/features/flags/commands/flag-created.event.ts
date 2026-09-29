import { plainToInstance } from 'class-transformer';
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
