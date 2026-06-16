export interface BaseDomainEventPayload {
  aggregateCompositeIdentifier: {
    type: string;
    id: string;
  };
}

export interface IDomainEvent<
  T extends BaseDomainEventPayload = BaseDomainEventPayload,
> {
  type: string;
  payload: T;
}
