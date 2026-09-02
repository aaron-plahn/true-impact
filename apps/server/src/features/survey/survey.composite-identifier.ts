import { Literal, NestedDataType, NonEmptyString } from '../../libs/data-types';
import { SURVEY_AGGREGATE_TYPE } from './constants';

export const SurveyCompositeIdentifierValuedProp = NestedDataType(
  () => SurveyCompositeIdentifier,
  {
    label: 'composite ID',
    description: 'system-wide unique identifier to a survey',
  },
);

export class SurveyCompositeIdentifier {
  @Literal(SURVEY_AGGREGATE_TYPE, {
    label: 'type',
    description: `always has the value [${SURVEY_AGGREGATE_TYPE}]`,
  })
  readonly type = SURVEY_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'unique identifier for this survey',
    isArray: false,
    isOptional: false,
  })
  id: string;
}
