import { Ctor, Entity, TrueImpactError } from 'src/libs';

export class InMemoryCommandRepository<T extends Entity> {
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
    throw new Error('Method not implemented.');
  }

  async create(instance: T): Promise<string | TrueImpactError> {
    // How should we handle this?
    const id = this.getNextId();

    if (this.entititesById.has(id)) {
      return new TrueImpactError(
        `Unique key constraint violated (id): ${id} when creating a T.`,
      );
    }

    const idSetResult = instance.setInitialId(id);

    if (idSetResult instanceof TrueImpactError) {
      return idSetResult;
    }

    this.entititesById.set(id, instance);

    return Promise.resolve(id);
  }

  createMany(_instances: T[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private getNextId() {
    return (++this._nextId).toString();
  }
}
