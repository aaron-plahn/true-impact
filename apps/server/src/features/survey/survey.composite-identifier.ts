import { NestedDataType, NonEmptyString } from '../../libs/data-types';
import { SURVEY_AGGREGATE_TYPE } from './constants';

export const SurveyCompositeIdentifierValuedProp = NestedDataType(
  () => SurveyCompositeIdentifier,
  {
    label: 'composite ID',
    description: 'system-wide unique identifier to a survey',
  },
);

export class SurveyCompositeIdentifier {
  //   @FixedValue(...)
  @NonEmptyString({
    label: 'type',
    description: SURVEY_AGGREGATE_TYPE,
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
