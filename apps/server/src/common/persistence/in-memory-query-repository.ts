import {
  Ctor,
  TrueImpactBadUserInputError,
  TrueImpactError,
  ViewModel,
} from '../../libs/data-types';

export class InMemoryQueryRepository<T extends ViewModel> {
  private _nextId = 0;

  private instanceCtor: Ctor<T>;

  constructor(
    C: Ctor<T>,
    private readonly entititesById: Map<string, T> = new Map(),
  ) {
    this.instanceCtor = C;
  }

  async fetchById(id: string): Promise<T | null> {
    const result = this.entititesById.get(id) || null;

    return Promise.resolve(result);
  }

  fetchMany(): Promise<T[]> {
    const result = Array.from(this.entititesById.values());

    return Promise.resolve(result);
  }

  async create(instance: T): Promise<string | TrueImpactError> {
    // How should we handle this?
    const id = this.getNextId();

    if (this.entititesById.has(id)) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Unique key constraint violated (id): ${id} when creating a T.`,
        ),
      ]);
    }

    this.entititesById.set(id, instance);

    return Promise.resolve(id);
  }

  createMany(_instances: T[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  update(
    instance: T,
  ): Promise<{ id: string; revision: string } | TrueImpactError> {
    const { id } = instance;

    if (!this.entititesById.has(id)) {
      return Promise.resolve(
        new TrueImpactError(
          `Failed to update entity ${this.instanceCtor.name} [${id}], as it does not exist.`,
        ),
      );
    }

    this.entititesById.set(id, instance);

    // We need to track revision numbers
    return Promise.resolve({ id, revision: 'oops' });
  }

  private getNextId() {
    return (++this._nextId).toString();
  }
}
