import { IBaseCommandRepository } from 'src/common/interfaces/persistence';
import { Client } from '../client.aggregate-root';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IClientCommandRepository extends IBaseCommandRepository<Client> {}
