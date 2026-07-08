import { ICommandFsa, PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import { HttpStatus } from '../../../libs/framework';
import { CommandErrorResponseBody } from './command-responses';
import { TestHttpClient } from './test-http-client';

export class RestCommandStreamExecutor {
  constructor(
    private readonly endpoint: string,
    // TODO pull this from .env \ config
    private readonly httpClient = new TestHttpClient('http://localhost:4200'),
  ) {}

  async execute(fsa: ICommandFsa) {
    const response = await this.httpClient
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
      PersistenceAcknowledgement | CommandErrorResponseBody;

    return result;
  }
}
