/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Inject } from '@nestjs/common';
import type {
  BaseEvent,
  IEventRepository,
  PersistenceAcknowledgement,
} from '../../../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../../libs/data-types';
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../constants';
import {
  SurveyParticipantCompositeIdentifier,
  SurveyResponseRecord,
} from '../models';
import { ISurveyResponseCommandRepository } from './survey-response-command-repository.interface';

/**
 * TODO export this from CQRS lib
 * TODO constrain the postgres implementation with this interface
 */

export class PostgresSurveyResponseCommandRepository implements ISurveyResponseCommandRepository {
  private readonly aggregateType = SURVEY_RESPONSE_AGGREGATE_TYPE;

  constructor(
    @Inject('EVENT_REPOSITORY_INJECTION_TOKEN')
    private readonly eventRepository: IEventRepository,
  ) {}

  async fetchById(id: string): Promise<SurveyResponseRecord | null> {
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

  /**
   * This supports a validation service that ensures that one participant can't
   * start a second instance of the same survey.
   *
   * Instead of doing things this way, what we might want to do is to emit `SurveyAttemptCancelled`
   * or execute `CancelSurvey` automatically when the read models become inconsistent.
   *
   * Even better, we can soft delete the other attempts so that the user cannot see them in the UX.
   */
  fetchSurveyForParticipant(
    _participant: SurveyParticipantCompositeIdentifier,
    _surveyId: string,
  ): Promise<SurveyResponseRecord[] | TrueImpactError> {
    throw new Error('Method not implemented.');
  }

  /**
   * We should remove this as soon as we move to synchronizing materialized
   * views by streaming the events to a query DB. It is a really inefficient way
   * of doing things.
   */
  async fetchMany(): Promise<SurveyResponseRecord[]> {
    const events = await this.eventRepository.read();

    const eventHistoriesByAggregateId = new Map<string, BaseEvent[]>();

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

    const results: SurveyResponseRecord[] = [];

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
          `Failed to fetch many survey responses due to invalid existing data in the database.`,
          errors,
        ),
      ]);
    }

    return results;
  }

  // Do we really need this, or just a `persist` \ `upsert`?
  async create(
    instance: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const { eventHistory } = instance;

    const result = await this.eventRepository.appendAt(
      0,
      // TODO where do metadata, stream ID , etc. come into the picture?
      ...(eventHistory as BaseEvent[]),
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
  async createMany(instances: SurveyResponseRecord[]): Promise<void> {
    for (const instance of instances) {
      await this.create(instance);
    }
  }

  /**
   * We should call this `persist` or `upsert`.
   */
  async update(
    instance: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    const { revision, eventHistory } = instance;

    if (eventHistory.length === 0) {
      throw new TrueImpactError(
        `Failed to persist update due to missing event history for survey/${instance.id}`,
      );
    }

    const recentEvents = eventHistory.slice(-1) as BaseEvent[];

    const result = await this.eventRepository.appendAt(
      revision,
      ...recentEvents,
    );

    if (result instanceof Error) {
      // TODO use a TrueImpactError for the nested error too
      return new TrueImpactError(result.message);
    }

    return {
      ...instance.getAggregateCompositeIdentifier(),
      /**
       * This is not the right way to do this.
       *
       * Can `EventRepository.appendAt(...)` return the updated `revision` number? We need to take great
       * care with this, as it is the basis of optimistic concurrency in our system.
       */
      revision: (instance.revision + recentEvents.length).toString(),
    };
  }

  /**
   * We don't need specific update methods since we are using event-sourcing.
   */
  begin(
    _emptyCompletionRecord: SurveyResponseRecord,
  ): Promise<PersistenceAcknowledgement | TrueImpactError> {
    throw new Error('Method not implemented.');
  }

  // Iterable<BaseEvent>
  private buildInstance(
    eventStream: BaseEvent[],
  ): SurveyResponseRecord | TrueImpactError | null {
    return SurveyResponseRecord.fromEventHistory(eventStream);
  }

  // TODO remove this!
  async clear() {
    if (!['test', 'e2e'].includes(process.env.NODE_ENV || '**NEVER**')) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot clear surveys in the non-test environment [${process.env.NODE_ENV}]`,
        ),
      ]);
    }

    // @ts-expect-error This is not part of the interface but it is on all concrete implementations.
    await this.eventRepository.clear();
  }
}
