import { TrueImpactError } from '../../../libs/data-types';

export class CannotEditLiveSurveyError extends TrueImpactError {
  constructor(surveyName: string) {
    super(
      `You cannot edit survey [${surveyName}] as it has already been finalized for use.\n`,
    );
  }
}
