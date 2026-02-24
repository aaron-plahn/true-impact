import { NonEmptyString } from '../../libs/data-types';
import { SURVEY_AGGREGATE_TYPE } from './constants';

export class SurveyCompositeIdentifier {
  //   @FixedValue(...)
  readonly type = SURVEY_AGGREGATE_TYPE;

  @NonEmptyString({
    label: 'ID',
    description: 'unique identifier for this survey',
    isArray: false,
    isOptional: false,
  })
  id: string;
}
