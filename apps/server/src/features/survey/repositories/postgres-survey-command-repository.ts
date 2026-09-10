import { PersistenceAcknowledgement } from 'src/libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs/data-types';
import { PostgresEventRepository } from 'src/postgresql/postgres-event.repository';
import { SURVEY_AGGREGATE_TYPE } from '../constants';
import { Survey } from '../survey-management';
import { SurveyCompositeIdentifier } from '../survey.composite-identifier';
import { ISurveyCommandRepository } from './survey-command-repository.interface';

export class PostgresSurveyCommandRepository implements ISurveyCommandRepository {
  // Do we want an interface here?
  constructor(private readonly eventRepository: PostgresEventRepository) {}

  async exists(id: string): Promise<boolean> {
    const eventsForMe = await this.eventRepository.read(
      this.buildAggregateId(id),
    );

    return eventsForMe.length > 0;
  }

  async fetchById(id: string): Promise<Survey | null> {
    const eventHistory = await this.eventRepository.read(
      this.buildAggregateId(id),
    );

    const buildResult = Survey.fromEventHistory(eventHistory, id);

    if (buildResult instanceof Error) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Failed to build survey/${id} due to invalid existing state in the database.`,
          [buildResult],
        ),
      ]);
    }

    return buildResult;
  }

  fetchMany(): Promise<Survey[]> {
    throw new Error('Method not implemented.');
  }

  create(
    instance: Survey,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    throw new Error('Method not implemented.');
  }

  createMany(instances: Survey[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  revokeAccess(
    id: string,
    hashedAccessCode: string,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    throw new Error('Method not implemented.');
  }

  update(
    instance: Survey,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    throw new Error('Method not implemented.');
  }

  private buildAggregateId(id: string): SurveyCompositeIdentifier {
    return {
      id,
      type: SURVEY_AGGREGATE_TYPE,
    };
  }
}
