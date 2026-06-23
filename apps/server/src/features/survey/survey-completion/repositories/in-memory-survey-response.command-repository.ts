import { isDeepStrictEqual } from 'util';
import { InMemoryCommandRepository } from '../../../../common/persistence';
import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyParticipantCompositeIdentifier } from '../models';
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

  async fetchSurveyForParticipant(
    participant: SurveyParticipantCompositeIdentifier,
    surveyId: string,
  ): Promise<SurveyResponseRecord[] | TrueImpactError> {
    const all = await this.base.fetchMany();

    return all.filter((s) => {
      if (!isDeepStrictEqual(participant, s.participant)) {
        return false;
      }

      if (s.survey.id !== surveyId) {
        return false;
      }

      return true;
    });
  }

  create(
    instance: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    return this.base.create(instance);
  }

  async begin(
    emptyCompletionRecord: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
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
