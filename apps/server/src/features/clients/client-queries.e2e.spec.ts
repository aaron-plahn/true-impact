import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Client } from './client.aggregate-root';
import { ClientModule } from './client.module';
import { CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN } from './constants';
import { InMemoryClientCommandRepository } from './repositories';

const testClientId = '1';

const baseEndpoint = '/clients';

describe(`/clients`, () => {
  let app: INestApplication<App>;

  let initialClients: Client[] = [];

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      imports: [ClientModule],
    })
      .overrideProvider(CLIENT_COMMAND_REPOSITORY_INJECTION_TOKEN)
      .useValue(
        new InMemoryClientCommandRepository(
          initialClients.reduce(
            (acc, client) => acc.set(client.id, client),
            new Map<string, Client>(),
          ),
        ),
      )
      .compile();

    app = testModule.createNestApplication();

    await app.init();
  });

  /**
   * TODO
   * - When the user is authenticated
   *     - when the user has sufficient RBA
   *     - when the user does not have RBA
   * - When the user is not authenticated
   */
  describe(`GET /clients/:id`, () => {
    describe(`when there is a client with the given ID`, () => {
      initialClients = [
        new Client({
          id: testClientId,
          fullName: { firstName: 'John', lastName: 'Deer' },
          dateOfBirth: '2025-08-01',
          isIndigenous: 'Yes',
          community: 'Blue Water',
        }),
      ];

      it(`should return the client`, async () => {
        const res = await request(app.getHttpServer()).get(
          `${baseEndpoint}/${testClientId}`,
        );

        expect(res.status).toBe(HttpStatus.OK);

        const body = res.body as Client;

        expect(body).toMatchSnapshot();
      });
    });

    describe(`when there is no client with the given ID`, () => {
      it(`should return a 404`, async () => {
        const res = await request(app.getHttpServer()).get(
          `${baseEndpoint}/BOGUS-ID`,
        );

        expect(res.status).toBe(HttpStatus.NOT_FOUND);
      });
    });
  });
});
