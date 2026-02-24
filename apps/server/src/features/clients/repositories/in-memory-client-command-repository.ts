import { TrueImpactError } from '../../../libs/data-types';
import { Client } from '../client.aggregate-root';
import { IClientCommandRepository } from './client-command-repository.interface';

export class InMemoryClientCommandRepository implements IClientCommandRepository {
  private _nextId = 0;

  constructor(
    private readonly entititesById: Map<string, Client> = new Map(),
  ) {}

  //   @ts-expect-error Is TS broken here?
  async fetchById(id: string): Promise<Client | null> {
    const result = this.entititesById.get(id) || null;

    return Promise.resolve(result);
  }

  fetchMany(): Promise<Client[]> {
    throw new Error('Method not implemented.');
  }

  async create(instance: Client): Promise<string | TrueImpactError> {
    const id = this.getNextId();

    if (this.entititesById.has(id)) {
      return new TrueImpactError(
        `Unique key constraint violated (id): ${id} when creating a client.`,
      );
    }

    instance.id = id;

    this.entititesById.set(id, instance);

    return Promise.resolve(id);
  }

  createMany(_instances: Client[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private getNextId() {
    return (++this._nextId).toString();
  }
}
