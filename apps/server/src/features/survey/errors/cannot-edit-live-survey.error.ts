import { TrueImpactError } from '../../../libs';

export class CannotEditLiveSurveyError extends TrueImpactError {
  constructor(surveyName: string) {
    super(
      `You cannot edit survey [${surveyName}] as it has already been published for use.\n`,
    );
  }
}
