import { IBaseCommandRepository } from 'src/common/interfaces/persistence';
import { Client } from '../client.aggregate-root';

export interface IClientCommandRepository extends IBaseCommandRepository<Client> {}
