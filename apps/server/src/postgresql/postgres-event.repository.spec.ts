import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { assertTextMatchesAll } from '../libs/test-utils';
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

const WIDGET_LABELLED = 'WIDGET_LABELLED';

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

class WidgetLabelled {
  streamId: string;

  readonly type = WIDGET_LABELLED;

  readonly payload: {
    aggregateCompositeIdentifier: { type: string; id: string };
    label: string;
  };

  readonly meta: ToyEventMeta;

  revision: number;

  constructor(dto: WidgetLabelled) {
    Object.assign(this, dto);
  }
}

const widgetLabelled = new WidgetLabelled({
  streamId: 'widget123',
  // Shouldn't this come back from the DB, but not be sent to the DB for append operations?
  revision: 1,
  type: WIDGET_LABELLED,
  payload: {
    aggregateCompositeIdentifier: {
      type: WIDGET,
      id: '1',
    },
    label: 'Big Widget',
  },
  meta: {
    userId: '555',
    dateEffective: '1234568',
  },
});

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

    eventFactory.register(WIDGET_LABELLED, (doc) => {
      // @ts-expect-error TODO fix the types here
      return new WidgetLabelled(doc);
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

  describe(`when appending a second event`, () => {
    describe(`when the revision number is consistent`, () => {
      it(`should succeed`, async () => {
        await testRepository.appendEvent(firstWidgetCreated, 0);

        await testRepository.appendEvent(widgetLabelled, 1);

        const searchResult = await testRepository.read();

        expect(searchResult).toHaveLength(2);

        expect(searchResult[0].type).toBe(WIDGET_CREATED);

        expect(searchResult[1].type).toBe(WIDGET_LABELLED);
      });
    });

    describe(`when an event has been written since the previous read`, () => {
      it(`should return an optimistic concurrency error`, async () => {
        await testRepository.appendEvent(firstWidgetCreated, 0);

        await testRepository.appendEvent(widgetLabelled, 1);

        const secondAppendAttempt = await testRepository.appendEvent(
          widgetLabelled,
          1,
        );

        expect(secondAppendAttempt).toBeInstanceOf(Error);

        // Do we want .toString?
        const message = (secondAppendAttempt as Error).message;

        assertTextMatchesAll(
          message,
          'Failed to persist',
          widgetLabelled.streamId,
          '1',
        );
      });
    });
  });
});
