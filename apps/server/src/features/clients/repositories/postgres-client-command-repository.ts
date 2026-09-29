import { Inject } from '@nestjs/common';
import {
  DomainEvent,
  EVENT_REPOSITORY_INJECTION_TOKEN,
  type IEventRepository,
  PersistenceAcknowledgement,
} from '../../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../libs/data-types';
import { Client } from '../client.aggregate-root';
import { CLIENT_AGGREGATE_TYPE } from '../client.composite-identifier';
import { IClientCommandRepository } from './client-command-repository.interface';

export class PostgresClientCommandRepository implements IClientCommandRepository {
  private readonly aggregateType = CLIENT_AGGREGATE_TYPE;

  constructor(
    @Inject(EVENT_REPOSITORY_INJECTION_TOKEN)
    private readonly eventRepository: IEventRepository,
  ) {}

  async exists(id: string): Promise<boolean> {
    const searchResult = await this.fetchById(id);

    return searchResult !== null;
  }

  async fetchById(id: string): Promise<Client | TrueImpactError | null> {
    const eventHistory = await this.eventRepository.read({
      type: this.aggregateType,
      id,
    });

    return this.buildInstance(eventHistory);
  }

  fetchMany(): Promise<Client[]> {
    throw new Error('Method not implemented.');
  }

  // TODO should we merge this with `update` to form a single `upsert`?
  async create(
    instance: Client,
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

  // Test helper
  async createMany(instances: Client[]): Promise<void> {
    for (const instance of instances) {
      await this.create(instance);
    }
  }

  async update(
    instance: Client,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const { revision, eventHistory } = instance;

    if (eventHistory.length === 0) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          // we don't want to expose the name in logs
          `Failed to persist updated due to missing event history for client [${instance.id}]`,
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
      revision: (instance.revision + recentEvents.length).toString(),
    };
  }

  private buildInstance(
    eventStream: Iterable<DomainEvent>,
  ): Client | TrueImpactError | null {
    return Client.fromEventHistory(eventStream);
  }
}
