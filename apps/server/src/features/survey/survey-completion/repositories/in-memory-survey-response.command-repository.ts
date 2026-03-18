import { isDeepStrictEqual } from 'util';
import { InMemoryCommandRepository } from '../../../../common/persistence';
import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../../../libs/data-types';
import { SurveyResponseRecord } from '../models/survey-response-record.aggregate-root';
import { ISurveyResponseCommandRepository } from './survey-response-command-repository.interface';

export class InMemorySurveyResponseCommandRepository implements ISurveyResponseCommandRepository {
  private readonly base = new InMemoryCommandRepository(SurveyResponseRecord);

  exists(id: string): Promise<boolean> {
    return this.base.exists(id);
  }

  fetchById(id: string): Promise<SurveyResponseRecord | null> {
    return this.base.fetchById(id);
  }

  fetchMany(): Promise<SurveyResponseRecord[]> {
    return this.base.fetchMany();
  }

  create(
    instance: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    return this.base.create(instance);
  }

  async begin(
    emptyCompletionRecord: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    if (emptyCompletionRecord.participant) {
      // This is not how we should implement this in the production DB as it's not performant
      const allAttempts = await this.base.fetchMany();

      const activeAttemptsForThisParticipant = allAttempts.filter((attempt) => {
        if (attempt.hasBeenSubmitted || attempt.hasBeenAbandoned) {
          return false;
        }

        return isDeepStrictEqual(
          attempt.participant,
          emptyCompletionRecord.participant,
        );
      });

      if (activeAttemptsForThisParticipant.length > 0) {
        return new TrueImpactBadUserInputError([
          new TrueImpactError(
            `You cannot begin a new attempt of survey [${emptyCompletionRecord.survey.name}], as there is already an attempt [${activeAttemptsForThisParticipant[0].id}] in progress for participant ${emptyCompletionRecord.participant.type}/${emptyCompletionRecord.participant.id}`,
          ),
        ]);
      }
    }

    const result = await this.base.create(emptyCompletionRecord);

    if (result instanceof TrueImpactError) {
      return result;
    }

    return result;
  }

  createMany(instances: SurveyResponseRecord[]): Promise<void> {
    return this.base.createMany(instances);
  }

  update(
    instance: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    return this.base.update(instance);
  }

  clear() {
    return this.base.clear();
  }
}
