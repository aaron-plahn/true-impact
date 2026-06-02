import axios, { RawAxiosRequestHeaders } from 'axios';
import { ICommandFsa, PersistenceAcknowledgement } from '../../../libs/cqrs-es';
import { HttpStatus } from '../../../libs/framework';
import { CommandErrorResponseBody } from './command-responses';

export class RestCommandStreamExecutor {
  private readonly httpClient = axios.create({
    withCredentials: true,
  });

  constructor(private readonly endpoint: string) {}

  async execute(fsa: ICommandFsa, headers: RawAxiosRequestHeaders = {}) {
    const response = await this.httpClient
      // @ts-expect-error We need to fix the types in this file
      .post(this.endpoint, fsa, { ...headers, Origin: 'http://localhost:4200' })
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
