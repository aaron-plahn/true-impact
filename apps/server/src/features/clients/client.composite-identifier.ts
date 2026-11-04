import { Literal, NestedDataType, NonEmptyString } from '../../libs/data-types';

export const CLIENT_AGGREGATE_TYPE = 'client';

export const ClientCompositeIdentifierValuedProp = NestedDataType(
  () => ClientCompositeIdentifier,
  {
    label: 'composite ID',
    description: 'system-wide identifier for this client',
  },
);

export class ClientCompositeIdentifier {
  @Literal(CLIENT_AGGREGATE_TYPE, {
    label: 'type',
    description: 'distinguishes clients from other entities in our system',
  })
  readonly type = CLIENT_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'uniquely identifies this client from other clients',
  })
  id: string;
}
