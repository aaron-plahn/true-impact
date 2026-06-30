import { IDomainEvent } from '../../../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../../libs/data-types';
import { Section } from '../../../../libs/server-driven-ui';

export interface SDUIViewDiff {
  target: string; // element ID
  swap: 'outer';
  content: Section; // upstream will convert to HTML
}

export interface SduiDiffProducer<T extends IDomainEvent = IDomainEvent> {
  handle(e: T): Promise<SDUIViewDiff>;
}

export class SduiViewDiffer {
  consumers: Map<string, SduiDiffProducer> = new Map();

  async calculateDiff(event: IDomainEvent): Promise<SDUIViewDiff | null> {
    if (!this.consumers.has(event.type)) {
      return null;
    }

    const diff = await this.consumers.get(event.type)?.handle(event);

    return diff || null;
  }

  register({
    eventType,
    consumer,
  }: {
    eventType: string;
    consumer: SduiDiffProducer;
  }): SduiViewDiffer {
    if (this.consumers.has(eventType)) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Redundant SDUI view producer encountered for event of type: ${eventType}`,
        ),
      ]);
    }

    this.consumers.set(eventType, consumer);

    return this;
  }
}
