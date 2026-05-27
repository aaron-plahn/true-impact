import { TrueImpactError } from 'src/libs/data-types';
import { SurveyResponseSession } from '../models/survey-response-session';

export const SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN =
  'SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN';

export interface ISurveyResponseSessionRepository {
  get(sessionId: string): Promise<SurveyResponseSession | TrueImpactError>;

  // TODO do we return any info here?
  set(
    session: SurveyResponseSession,
  ): Promise<{ id: string } | TrueImpactError>;

  revoke(sessionId: string): Promise<TrueImpactError | { id: string }>;
}
