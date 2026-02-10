import { Ctor, TrueImpactError, ViewModel } from 'src/libs';

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
      return new TrueImpactError(
        `Unique key constraint violated (id): ${id} when creating a T.`,
      );
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
