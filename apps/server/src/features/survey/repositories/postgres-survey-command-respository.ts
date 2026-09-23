import type {
  DomainEvent,
  IEventRepository,
  PersistenceAcknowledgement,
} from 'src/libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs/data-types';
import { Inject } from '../../../libs/framework';
import { SURVEY_AGGREGATE_TYPE } from '../constants';
import { Survey } from '../survey-management';
import { ISurveyCommandRepository } from './survey-command-repository.interface';

// TODO Share code between command repositories for different aggregate roots
export class PostgresSurveyCommandRepository implements ISurveyCommandRepository {
  private readonly aggregateType = SURVEY_AGGREGATE_TYPE;

  constructor(
    @Inject('EVENT_REPOSITORY_INJECTION_TOKEN')
    private readonly eventRepository: IEventRepository,
  ) {}

  async exists(id: string): Promise<boolean> {
    const result = await this.fetchById(id);

    // Should `Error` be a possible return type?
    return result !== null;
  }

  async fetchById(id: string): Promise<Survey | null> {
    const eventHistory = await this.eventRepository.read({
      type: this.aggregateType,
      id,
    });

    const buildResult = this.buildInstance(eventHistory);

    if (buildResult instanceof Error) {
      throw new TrueImpactError(
        `Failed to fetch survey/${id}, as invalid data was encountered in the database.`,
        [buildResult],
      );
    }

    return buildResult;
  }

  async fetchMany(): Promise<Survey[]> {
    const events = await this.eventRepository.read();

    const eventHistoriesByAggregateId = new Map<string, DomainEvent[]>();

    for (const e of events) {
      const {
        payload: {
          aggregateCompositeIdentifier: { id, type: aggregateType },
        },
      } = e;

      if (aggregateType !== this.aggregateType) {
        continue;
      }

      const existingEventsForThisAggregate =
        eventHistoriesByAggregateId.get(id);

      const eventsForThisAggregateRootSoFar =
        existingEventsForThisAggregate || [];

      eventsForThisAggregateRootSoFar.push(e);

      eventHistoriesByAggregateId.set(id, eventsForThisAggregateRootSoFar);
    }

    const results: Survey[] = [];

    const errors: TrueImpactError[] = [];

    for (const aggregateId of eventHistoriesByAggregateId.keys()) {
      const eventsForThisAggregateRoot =
        eventHistoriesByAggregateId.get(aggregateId);

      if (!eventsForThisAggregateRoot) {
        continue;
      }

      const buildResult = this.buildInstance(eventsForThisAggregateRoot);

      if (!buildResult) {
        continue;
      }

      if (buildResult instanceof Error) {
        errors.push(buildResult);
      } else {
        results.push(buildResult);
      }
    }

    if (errors.length > 0) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Failed to fetch many surveys due to invalid existing data in the database.`,
          errors,
        ),
      ]);
    }

    return results;
  }

  // Do we really need this, or just a `persist` \ `upsert`? Address this.
  async create(
    instance: Survey,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const { eventHistory } = instance;

    if (eventHistory.length === 0) {
      throw new Error(
        `Missing event history for survey: [${instance.getName()}]`,
      );
    }

    const result = await this.eventRepository.appendAt(
      0,
      // TODO where do metadata, stream ID , etc. come into the picture?
      ...eventHistory,
    );

    if (result instanceof Error) {
      // TODO is the underlying result a `TrueImpactError`? If so, we are swallowing nested error context here.
      return new TrueImpactError(result.message);
    }

    const ack: PersistenceAcknowledgement = {
      type: instance.getAggregateCompositeIdentifier().type,
      id: instance.getId(),
      // make sure the `fromEventHistory` logic counts the revisions properly - can we have some structural tests around this?
      revision: eventHistory.length.toString(),
    };

    // what do we do with the stream ID?
    return ack;
  }

  // Note that this is only used as a test helper
  async createMany(instances: Survey[]): Promise<void> {
    for (const instance of instances) {
      await this.create(instance);
    }
  }

  /**
   * We should call this `persist` or `upsert`.
   */
  async update(
    instance: Survey,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const { revision, eventHistory } = instance;

    if (eventHistory.length === 0) {
      throw new TrueImpactError(
        `Failed to persist update due to missing event history for survey/${instance.id}`,
      );
    }

    const recentEvents = eventHistory.slice(-1);

    // TODO can we store `uncommittedEvents` separately?
    recentEvents.forEach((recentEvent) => {
      Object.assign(recentEvent, {
        streamId: `${SURVEY_AGGREGATE_TYPE}/${instance.id}`,
      });
    });

    const result = await this.eventRepository.appendAt(
      revision,
      ...recentEvents,
    );

    if (result instanceof Error) {
      return new TrueImpactError(result.message);
    }

    return {
      ...instance.getAggregateCompositeIdentifier(),
      /**
       * This is not the right way to do this.
       *
       * Can `EventRepository.appendAt(...)` return the updated `revision` number? We need to take great
       * care with this, as it is the basis of optimistic concurrency in our system.
       * TODO deal with this!
       */
      revision: (instance.revision + recentEvents.length).toString(),
    };
  }

  private buildInstance(
    eventStream: DomainEvent[],
  ): Survey | TrueImpactError | null {
    return Survey.fromEventHistory(eventStream);
  }

  // TODO remove this?
  async clear() {
    if (!['test', 'e2e'].includes(process.env.NODE_ENV || '**NEVER**')) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot clear surveys in the non-test environment [${process.env.NODE_ENV}]`,
        ),
      ]);
    }

    // @ts-expect-error This is not part of the interface but it is on all concrete implementations.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.eventRepository.clear();
  }
}
