import { PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import { HttpStatus } from '../../../libs/framework';

// TODO move this to libs/framework
export type CommandErrorResponseBody = {
  status: number;
  message: string;
};

export type SuccessResponse = {
  status: HttpStatus;
  body: PersistenceAcknowledgement;
};
