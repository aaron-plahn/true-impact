import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../libs/data-types';
import { BaseEvent, EventDto } from './postgres-event.repository';

interface EventFactoryFunction<T extends BaseEvent = BaseEvent> {
  (event: EventDto): T;
}

export class EventFactory {
  private eventTypeToFactoryFunction = new Map<string, EventFactoryFunction>();

  build<T extends BaseEvent = BaseEvent>(eventDocument: EventDto): T {
    const factoryFunction = this.eventTypeToFactoryFunction.get(
      eventDocument.type,
    );

    if (!factoryFunction) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Failed to find a factory for event of unknown type: ${eventDocument.type}`,
        ),
      ]);
    }

    return factoryFunction(eventDocument) as T;
  }

  register(
    eventType: string,
    factoryFunction: (eventDocument: EventDto) => BaseEvent,
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
