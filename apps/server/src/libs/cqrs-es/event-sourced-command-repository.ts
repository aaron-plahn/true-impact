import {
  EventSourcedAggregateRoot,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../data-types';
import { PersistenceAcknowledgement } from './command-handler.interface';
import {
  DomainEvent,
  type IEventRepository,
} from './event-repository.interface';

interface EventSourcedAggregateFactory<TAggregateRoot> {
  (
    eventHistory: Iterable<DomainEvent>,
  ): TAggregateRoot | TrueImpactError | null;
}

export class EventSourcedCommandRepository<
  TAggregateRoot extends EventSourcedAggregateRoot,
> {
  private aggregateLabels: {
    singular: string;
    plural: string;
  };

  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly aggregateType: string,
    private readonly buildInstance: EventSourcedAggregateFactory<TAggregateRoot>,
  ) {
    // TODO use reflection to get this
    this.aggregateLabels = {
      singular: aggregateType,
      plural: `${aggregateType}s`,
    };
  }

  async exists(id: string): Promise<boolean> {
    const searchResult = await this.fetchById(id);

    return searchResult !== null;
  }

  async fetchById(
    id: string,
  ): Promise<TAggregateRoot | TrueImpactError | null> {
    const eventHistory = await this.eventRepository.read({
      type: this.aggregateType,
      id,
    });

    return this.buildInstance(eventHistory);
  }

  /**
   * **WARNING** This is extremely inefficient. It is provided to support
   * index queries but will only be feasible for small amounts (say dozens of aggregate roots)
   * of data. You should implement materialized views that are synchronized via event consumers
   * if you have more data than this.
   */
  async fetchMany(): Promise<TAggregateRoot[]> {
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

    const results: TAggregateRoot[] = [];

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
          `Failed to fetch many ${this.aggregateLabels.plural} due to invalid existing data in the database`,
          errors,
        ),
      ]);
    }

    return results;
  }

  async create(
    instance: TAggregateRoot,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const { eventHistory } = instance;

    if (eventHistory.length === 0) {
      throw new Error(
        `Missing event history for client [${instance.getName()}]`,
      );
    }

    const result = await this.eventRepository.appendAt(0, ...eventHistory);

    if (result instanceof Error) {
      return new TrueImpactError(result.message);
    }

    const ack: PersistenceAcknowledgement = {
      type: instance.getCompositeIdentifier().type,
      id: instance.getId(),
      revision: eventHistory.length.toString(),
    };

    return ack;
  }

  async update(
    instance: TAggregateRoot,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const { revision, eventHistory } = instance;

    if (eventHistory.length === 0) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          // we don't want to expose the name in logs
          `Failed to persist updated due to missing event history for ${this.aggregateLabels.singular} [${instance.id}]`,
        ),
      ]);
    }

    // TODO make this the domain's responsibility
    const recentEvents = eventHistory.filter((_event, index) => {
      const eventSequenceNumber = index + 1;

      return eventSequenceNumber > revision;
    });

    // recentEvents.forEach((recentEvent) => {
    //   Object.assign(recentEvent, {
    //     // TODO metadata
    //   });
    // });

    const result = await this.eventRepository.appendAt(
      revision,
      ...recentEvents,
    );

    if (result instanceof Error) {
      return new TrueImpactError(result.message);
    }

    return {
      ...instance.getCompositeIdentifier(),
      // TODO get this from the db
      // can we do this now?
      revision: (instance.revision + recentEvents.length).toString(),
    };
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
