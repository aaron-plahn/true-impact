import { SurveyResponseCompositeIdentifier } from './survey-response-record.aggregate-root';

export class SurveyResponseCookie {
  /** Returns the original `maxAge` (time-to-live), in milliseconds, of the session cookie. */
  originalMaxAge: number | null;

  maxAge?: number | undefined;
  signed?: boolean | undefined; // should be true by default
  expires?: Date | null | undefined;
  httpOnly?: boolean | undefined;
  path?: string | undefined;
  domain?: string | undefined;
  secure?: 'auto' | boolean | undefined; // `true` in prod, `false` for dev and test
  sameSite?: boolean | 'lax' | 'strict' | 'none' | undefined;
}

// TODO Is this any old session? Do we want a union type for this?
export class SurveyResponseSession {
  id: string;
  userId?: string;
  subject?: SurveyResponseCompositeIdentifier;
  cookie: SurveyResponseCookie;
}
