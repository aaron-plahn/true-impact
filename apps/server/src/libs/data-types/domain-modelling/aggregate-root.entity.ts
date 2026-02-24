import { Entity } from './entity';

export abstract class AggregateRoot<
  TPersistenceDto,
> extends Entity<TPersistenceDto> {
  abstract id: string;

  abstract revision: number;

  /**
   * Nested entities do not typically have a system ID (e.g. sequential ID or UUID) as they are persisted and
   * updated only within the context of the parent aggregate root. Instead, they have local identifiers,
   * such as a page number within the context of a book or a question label within the context of a survey.
   */
  override getId(): string {
    return this.id;
  }
}
