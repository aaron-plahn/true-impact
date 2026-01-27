import { Client } from '../client.aggregate-root';
import { IClientCommandRepository } from './client-command-repository.interface';

export class InMemoryClientCommandRepository implements IClientCommandRepository {
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

  async create(instance: Client): Promise<void> {
    this.entititesById.set(instance.getId(), instance);

    Promise.resolve();
  }

  createMany(instances: Client[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
