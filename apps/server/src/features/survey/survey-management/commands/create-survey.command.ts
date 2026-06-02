import {
  NonEmptyString,
  TrueImpactDataExample,
} from '../../../../libs/data-types';

@TrueImpactDataExample<CreateSurvey>({
  example: {
    name: 'Program Engagement Survey',
  },
})
export class CreateSurvey {
  static readonly type = 'CREATE_SURVEY';

  @NonEmptyString({
    label: 'survey name',
    description: 'the name of this survey',
    isArray: false,
    isOptional: false,
  })
  name: string;

  // languageCode
}
