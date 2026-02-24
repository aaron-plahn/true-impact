import request from 'supertest';
import { App } from 'supertest/types';
import { clonePlainObject } from '../../../libs/data-types';
import { HttpStatus, INestApplication, Test } from '../../../libs/framework';
import { Client } from '../client.aggregate-root';
import { ClientModule } from '../client.module';
import { CreateClient } from './create-client.command';

const commandType = 'CREATE_CLIENT';

const endpoint = '/clients';

const command: CreateClient = {
  // aggregateCompositeIdentifier
  firstName: 'Aaron',
  lastName: 'DeBaron',
  dateOfBirth: '1999-12-31',
  isIndigenous: 'Yes',
  community: 'Tha Rez',
};

describe(commandType, () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const testModule = await Test.createTestingModule({
      imports: [ClientModule],
    }).compile();

    app = testModule.createNestApplication();

    await app.init();
  });

  describe('When the command is valid', () => {
    it(`should create the client`, async () => {
      const res = await request(app.getHttpServer())
        .post(endpoint)
        .send(command);

      expect(res.status).toBe(HttpStatus.CREATED);

      const { id } = res.body as Client;

      const fetchResponse = await request(app.getHttpServer()).get(
        `${endpoint}/${id}`,
      );

      const { fullName, community, isIndigenous, dateOfBirth } =
        fetchResponse.body as Client;

      const { firstName, lastName } = fullName;

      expect(id).not.toContain('GENERATE');

      expect(firstName).toEqual(command.firstName);

      expect(lastName).toEqual(command.lastName);

      expect(community).toEqual(command.community);

      expect(isIndigenous).toEqual(command.isIndigenous);

      expect(dateOfBirth).toEqual(command.dateOfBirth);
    });
  });

  describe(`When the command is invalid`, () => {
    describe(`When the client is not indigenous but has a community`, () => {
      const invalidCommand = clonePlainObject(command, {
        isIndigenous: 'No',
        community: "World's Best Rez",
      });

      it(`should return the expected error`, async () => {
        const res = await request(app.getHttpServer())
          .post(endpoint)
          .send(invalidCommand);

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);

        const { message } = res.body as { message: Error };

        expect(message).toContain('Client');

        expect(message).toContain('ill-formed');

        expect(message).toContain(
          'non-indigenous client cannot be registered to a community',
        );
      });
    });

    describe(`When it is unknown whether the client is indigenous, but they have a community`, () => {
      const invalidCommand = clonePlainObject(command, {
        isIndigenous: 'Unknown',
        community: 'Northville',
      });

      it(`should return the expected error`, async () => {
        const res = await request(app.getHttpServer())
          .post(endpoint)
          .send(invalidCommand);

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);

        const { message } = res.body as { message: Error };

        expect(message).toContain('Client');

        expect(message).toContain('ill-formed');

        expect(message).toContain(
          `When specifying a client's community, the client must be listed as Indigenous`,
        );
      });
    });

    describe(`when the command has an invalid type`, () => {
      it.todo(`should have a fuzz-test`);
    });
  });
});
