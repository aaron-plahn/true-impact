import {
  Literal,
  NestedDataType,
  NonEmptyString,
} from '../../../../libs/data-types';
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../constants';

export const SurveyResponseCompositeIdentifierValuedProp = NestedDataType(
  () => SurveyResponseCompositeIdentifier,
  {
    label: 'survey response composite ID',
    description: 'system-wide unique identifier to this survey response', // attempt?
  },
);

export class SurveyResponseCompositeIdentifier {
  @Literal(SURVEY_RESPONSE_AGGREGATE_TYPE, {
    label: 'type',
    description: 'type',
  })
  readonly type = SURVEY_RESPONSE_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: `unique system identifier for this survey attempt`,
  })
  id!: string;
}
