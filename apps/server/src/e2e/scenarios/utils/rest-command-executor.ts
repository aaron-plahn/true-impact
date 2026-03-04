import axios from 'axios';
import { ICommandFsa, PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import { HttpStatus } from '../../../libs/framework';
import { CommandErrorResponseBody } from './command-responses';

export class RestCommandStreamExecutor {
  constructor(private readonly endpoint: string) {}

  async execute(fsa: ICommandFsa) {
    const response = await axios
      .post(this.endpoint, fsa)
      .catch(
        (e: {
          status: HttpStatus;
          response: { data: CommandErrorResponseBody };
        }) => {
          return {
            status: e.status,
            data: {
              message: e.response.data.message,
            },
          };
        },
      );

    const result = response.data as
      | PersistenceAcknowledgement
      | CommandErrorResponseBody;

    return result;
  }
}
