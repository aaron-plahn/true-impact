import {
  DomainEvent,
  EventDto,
} from 'src/libs/cqrs-es/event-repository.interface';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../libs/data-types';

interface EventFactoryFunction<T extends DomainEvent = DomainEvent> {
  (event: EventDto): T;
}

export class EventFactory {
  private eventTypeToFactoryFunction = new Map<string, EventFactoryFunction>();

  build<T extends DomainEvent = DomainEvent>(eventDocument: EventDto): T {
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
    // is this where we inject metadata?
    factoryFunction: (eventDocument: EventDto) => DomainEvent,
  ): EventFactory {
    if (this.eventTypeToFactoryFunction.has(eventType)) {
      console.warn(
        `Skipping duplicate registration for factory for event of type: ${eventType}`,
      );

      return this;
    }

    this.eventTypeToFactoryFunction.set(eventType, factoryFunction);

    return this;
  }
}
