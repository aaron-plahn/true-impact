import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EventFactory } from './event-factory';
import { PostgresEventRepository } from './postgres-event.repository';
import { PostgresTestHelper } from './postgres-test-helper';
import { PostgresModule } from './postgres.module';

type ToyEventMeta = {
  userId: string;
  dateEffective: string;
};

const WIDGET = 'WIDGET';

const WIDGET_CREATED = 'WIDGET_CREATED';

class WidgetCreated {
  streamId: string;

  readonly type = 'WIDGET_CREATED';

  readonly payload: {
    aggregateCompositeIdentifier: { type: string; id: string };
    name: string;
  };

  readonly meta: ToyEventMeta;

  revision: number;

  constructor(doc: {
    streamId: string;
    type: typeof WIDGET_CREATED;
    payload: {
      aggregateCompositeIdentifier: { id: string };
      name: string;
    };
    meta: ToyEventMeta;
  }) {
    Object.assign(this, doc);
  }
}

const firstWidgetCreated: WidgetCreated = {
  streamId: 'widget123',
  revision: 0,
  type: WIDGET_CREATED,
  payload: {
    aggregateCompositeIdentifier: {
      type: WIDGET,
      id: '1',
    },
    name: 'First Born Widget!',
  },
  meta: {
    userId: '123',
    dateEffective: '1234567',
  },
};

describe(`PostgresEventRepository`, () => {
  let app: INestApplication;

  let testRepository: PostgresEventRepository;

  beforeAll(async () => {
    const testModule = await Test.createTestingModule({
      // TODO can we test a "forFeature?"
      imports: [
        (() => {
          const cm = ConfigModule.forRoot({
            isGlobal: true,
            // do we need a separate .env.test?
            envFilePath: [`../../.env.e2e`],
          });

          return cm;
        })(),
        PostgresModule.forRootAsync(),
      ],
    }).compile();

    app = testModule.createNestApplication();

    await app.init();

    const eventFactory = app.get(EventFactory);

    eventFactory.register(WIDGET_CREATED, (doc) => {
      // @ts-expect-error TODO fix the types here
      const instance = new WidgetCreated(doc);

      return instance;
    });

    testRepository = app.get('EVENT_REPOSITORY_INJECTION_TOKEN');
  });

  beforeEach(async () => {
    await app.get(PostgresTestHelper).clear('events');
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`when creating a first event`, () => {
    it(`should persist the event`, async () => {
      await testRepository.appendEvent(firstWidgetCreated, 0);

      const searchResult = await testRepository.read();

      expect(searchResult).toHaveLength(1);

      const foundRecord = searchResult[0];

      expect(foundRecord).toBeInstanceOf(WidgetCreated);

      expect(foundRecord.type).toBe(WIDGET_CREATED);

      expect(foundRecord.meta).toEqual(firstWidgetCreated.meta);

      expect(foundRecord.payload).toEqual(firstWidgetCreated.payload);

      expect(foundRecord.streamId).toEqual(firstWidgetCreated.streamId);

      expect(foundRecord.revision).toEqual(1);
    });
  });
});
