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
    subject?: SurveyResponseCompositeIdentifier;
    userId?: string;
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

  all(
    callback: (
      err: any,
      obj?:
        | session.SessionData[]
        | { [sid: string]: session.SessionData }
        | null,
    ) => void,
  ): void {
    this.sessionRepository
      .getAll()
      .then((result) => {
        if (result instanceof TrueImpactError) {
          return callback(result);
        }

        return callback(null, result);
      })
      .catch((err) => {
        callback(err);
      });
  }

  clear(callback?: (err?: any) => void): void {
    this.sessionRepository.clear().catch((err) => {
      if (typeof callback === 'function') {
        callback(err);
      }
    });
  }

  length(callback: (err: any, length?: number) => void): void {
    this.sessionRepository
      .count()
      .then((result) => {
        if (result instanceof Error) {
          return callback(result);
        }

        return callback(null, result);
      })
      .catch((err) => {
        return callback(err);
      });
  }

  // TODO implement remaining optional methods
  /**
   * touch(sid, session, callback): Resets the session's max age timer on new requests so active sessions do not expire.
   */
}
