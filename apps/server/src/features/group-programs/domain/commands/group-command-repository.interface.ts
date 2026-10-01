import { EventSourcedCommandRepository } from '../../../../libs/cqrs-es';
import { GroupProgram } from '../group-program.aggregate-root';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IGroupProgramCommandRepository extends EventSourcedCommandRepository<GroupProgram> {}
