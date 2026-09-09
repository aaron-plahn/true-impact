import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../libs/data-types';
import {
  BaseEvent,
  EventDocument,
  IEventFactory,
} from './postgres-event.repository';

interface EventFactoryFunction<T extends BaseEvent = BaseEvent> {
  (event: EventDocument): T;
}

export class EventFactory implements IEventFactory {
  private eventTypeToFactoryFunction = new Map<string, EventFactoryFunction>();

  build<T extends BaseEvent = BaseEvent>(eventDocument: EventDocument): T {
    const factoryFunction = this.eventTypeToFactoryFunction.get(
      eventDocument.event_type,
    );

    if (!factoryFunction) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Failed to find a factory for event of unknown type: ${eventDocument.event_type}`,
        ),
      ]);
    }

    return factoryFunction(eventDocument) as T;
  }

  register(
    eventType: string,
    factoryFunction: (eventDocument: EventDocument) => BaseEvent,
  ) {
    if (this.eventTypeToFactoryFunction.has(eventType)) {
      console.warn(
        `Skipping duplicate registration for factory for event of type: ${eventType}`,
      );

      return;
    }

    this.eventTypeToFactoryFunction.set(eventType, factoryFunction);
  }
}
