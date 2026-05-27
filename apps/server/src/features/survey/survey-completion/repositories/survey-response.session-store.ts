import session from 'express-session';
import { TrueImpactError } from 'src/libs/data-types';
import { Inject } from '../../../../libs/framework';
import { SurveyResponseCompositeIdentifier } from '../models';
import {
  SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN,
  type ISurveyResponseSessionRepository,
} from './survey-response.session-repository.interface';

declare module 'express-session' {
  interface SessionData {
    id: string;
    subject: SurveyResponseCompositeIdentifier;
  }
}

export class SurveyResponseSessionStore extends session.Store {
  constructor(
    @Inject(SURVEY_RESPONSE_SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepository: ISurveyResponseSessionRepository,
  ) {
    super();
  }

  get(
    sid: string,
    callback: (err: any, session?: session.SessionData | null) => void,
  ): void {
    this.sessionRepository
      .get(sid)
      .then((session) => {
        if (session instanceof TrueImpactError) {
          callback(session);

          return;
        }

        callback(null, session);
      })
      .catch((err) => {
        callback(err);
      });
  }

  set(
    // The session ID is part of our internal session model
    _sid: string,
    session: session.SessionData,
    callback?: (err?: any) => void,
  ): void {
    this.sessionRepository
      .set(session)
      .then((result) => {
        if (result instanceof Error) {
          if (typeof callback === 'function') callback(result);
        }
      })
      .catch((err) => {
        if (typeof callback === 'function') callback(err);
      });
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    this.sessionRepository
      .revoke(sid)
      .then((result) => {
        if (result instanceof TrueImpactError) {
          if (typeof callback === 'function') {
            callback(result);
          }
        }
      })
      .catch((err) => {
        if (typeof callback === 'function') {
          callback(err);
        }
      });
  }

  // TODO implement optional methods
  /**
   * touch(sid, session, callback): Resets the session's max age timer on new requests so active sessions do not expire.
   * all(callback): Fetches all active sessions as an array or object.
   * clear(callback): Deletes all sessions from the store.
   * length(callback): Returns the total count of active sessions.
   */
}
