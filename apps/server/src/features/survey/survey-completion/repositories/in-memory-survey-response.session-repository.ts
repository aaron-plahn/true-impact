import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyResponseSession } from '../models/survey-response-session';
import { ISurveyResponseSessionRepository } from './survey-response.session-repository.interface';

/**
 * This is meant for development \ testing only. In production, we should use a persistence mechanism such as
 * PostgreSQL or Redis.
 */
export class InMemorySurveyResponseSessionRepository implements ISurveyResponseSessionRepository {
  private readonly sessionsById = new Map<string, SurveyResponseSession>();

  get(sessionId: string): Promise<SurveyResponseSession | TrueImpactError> {
    if (!this.sessionsById.has(sessionId)) {
      const result = new TrueImpactError(
        `Survey completion session [${sessionId}] not found.`,
      );

      return Promise.resolve(result);
    }

    const session = this.sessionsById.get(sessionId) as SurveyResponseSession;

    return Promise.resolve(session);
  }

  getAll(): Promise<SurveyResponseSession[] | TrueImpactError> {
    return Promise.resolve(Array.from(this.sessionsById.values()));
  }

  set(
    session: SurveyResponseSession,
  ): Promise<{ id: string } | TrueImpactError> {
    this.sessionsById.set(session.id, session);

    return Promise.resolve({ id: session.id });
  }

  revoke(sessionId: string): Promise<TrueImpactError | { id: string }> {
    if (!this.sessionsById.has(sessionId)) {
      return Promise.resolve(
        new TrueImpactError('Failed to revoke unknown session.'),
      );
    }

    this.sessionsById.delete(sessionId);

    return Promise.resolve({ id: sessionId });
  }

  async clear(): Promise<void> {
    for (const k of this.sessionsById.keys()) {
      await this.revoke(k);
    }
  }

  count(): Promise<number> {
    return Promise.resolve(this.sessionsById.size);
  }
}
