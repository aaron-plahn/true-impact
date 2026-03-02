export const CLIENT_AGGREGATE_TYPE = 'client';

export class ClientCompositeIdentifier {
  readonly type = CLIENT_AGGREGATE_TYPE;

  id: string;
}
