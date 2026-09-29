import { NestedDataType } from '../../libs/data-types';

export const CLIENT_AGGREGATE_TYPE = 'client';

export const ClientCompositeIdentifierValuedProp = NestedDataType(
  () => ClientCompositeIdentifier,
  {
    label: 'composite ID',
    description: 'system-wide identifier for this client',
  },
);

export class ClientCompositeIdentifier {
  readonly type = CLIENT_AGGREGATE_TYPE;

  id: string;
}
