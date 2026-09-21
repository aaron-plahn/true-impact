import { InMemoryCommandRepository } from '../../../../common/persistence';
import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyResponseRecord } from '../models/survey-response-record.aggregate-root';
import { ISurveyResponseCommandRepository } from './survey-response-command-repository.interface';

export class InMemorySurveyResponseCommandRepository implements ISurveyResponseCommandRepository {
  private readonly base = new InMemoryCommandRepository(SurveyResponseRecord);

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
