import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../../libs/data-types';

@TrueImpactDataExample<BeginPublicSurvey>({
  example: {
    surveyId: '1',
  },
})
export class BeginPublicSurvey {
  static readonly type = 'BEGIN_PUBLIC_SURVEY';

  @NonEmptyString({
    label: 'survey ID',
    description: 'the survey you are going to complete',
  })
  surveyId: string;
}
