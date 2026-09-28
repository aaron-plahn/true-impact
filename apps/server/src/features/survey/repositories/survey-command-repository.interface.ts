import { PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import { TrueImpactError } from '../../../libs/data-types';
import { Survey } from '../survey-management/survey.aggregate-root';

export interface ISurveyCommandRepository {
  exists(id: string): Promise<boolean>;

  fetchById(id: string): Promise<Survey | null>; // Maybe<T>

  fetchMany(): Promise<Survey[]>;

  // Error || Ack
  create(
    instance: Survey,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;

  // Error[] ?
  createMany(instances: Survey[]): Promise<void>;

  update(
    instance: Survey,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;
}
