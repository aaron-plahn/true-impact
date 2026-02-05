import { AGGREGATE_COMPOSITE_IDENTIFIER } from './constants';

export interface ICommandPayload {
  [AGGREGATE_COMPOSITE_IDENTIFIER]: {
    type: string;
    id: string;
  };
}

export interface ICommandFsa<
  TPayload extends ICommandPayload = ICommandPayload,
> {
  type: string;
  payload: TPayload;
}
