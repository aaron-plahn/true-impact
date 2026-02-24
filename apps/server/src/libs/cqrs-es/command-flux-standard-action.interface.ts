export interface ICommandPayload {
  aggregateCompositeIdentifier: {
    type: string;
    id: string;
  };
}

/**
 * A creation command is not assumed to have an `aggregateCompositeIdentifier`.
 * One is acquired at some point during processing the request \ persisting the result.
 * An event record(s) stemming from a successful command will have an `aggregateCompositeIdentifier`
 * property on the payload with this generated ID and the aggregate type.
 */
export interface ICommandFsa<TPayload = unknown> {
  type: string;
  payload: TPayload;
}

export interface IUpdateCommandFsa<
  TPayload extends ICommandPayload = ICommandPayload,
> {
  type: string;
  payload: TPayload;
}
