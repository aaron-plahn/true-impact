import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyResponseSession } from '../models/survey-response-session';

export const SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN =
  'SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN';

export interface ISurveyResponseSessionRepository {
  get(sessionId: string): Promise<SurveyResponseSession | TrueImpactError>;

  getAll(): Promise<SurveyResponseSession[] | TrueImpactError>;

  set(
    session: SurveyResponseSession,
  ): Promise<{ id: string } | TrueImpactError>;

  revoke(sessionId: string): Promise<TrueImpactError | { id: string }>;

  clear(): Promise<void>;

  count(): Promise<TrueImpactError | number>;
}
