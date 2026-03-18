import { PersistenceAcknowledgement } from '../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../libs/data-types';
import { SurveyReview } from '../survey-review.aggregate-root';

export interface ISurveyReviewCommandRepository {
  exists(id: string): Promise<boolean>;

  fetchById(id: string): Promise<SurveyReview | null>; // Maybe<T>

  fetchMany(): Promise<SurveyReview[]>;

  // Error || Ack
  create(
    instance: SurveyReview,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;

  // Error[] ?
  createMany(instances: SurveyReview[]): Promise<void>;

  update(
    instance: SurveyReview,
  ): Promise<PersistenceAcknowledgement | TrueImpactError>;
}
