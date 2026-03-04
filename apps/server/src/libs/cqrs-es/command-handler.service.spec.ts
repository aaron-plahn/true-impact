import { plainToInstance } from 'class-transformer';
import {
  Ctor,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../data-types';
import { ICommandFsa } from './command-flux-standard-action.interface';
import { ICommandHandler } from './command-handler.interface';
import {
  COMMAND_EXECUTION_SCOPE,
  CommandHandlerService,
  ICommandHandlerResolver,
} from './command-handler.service';

describe(`CommandHandlerService`, () => {
  let commandHandlerService: CommandHandlerService;

  class CompositeIdentifier {
    readonly type: string;

    readonly id: string;
  }

  const happyCommandType = 'YES_MAN_COMMAND';

  const dummyRevisionId = '1';

  class HappyCommand {
    static type = happyCommandType;

    aggregateCompositeIdentifier: CompositeIdentifier;
  }

  class HappyHandler implements ICommandHandler {
    async handle({
      payload: {
        aggregateCompositeIdentifier: { id },
      },
    }: ICommandFsa) {
      return Promise.resolve({
        id,
        revision: dummyRevisionId,
        type: 'WIDGET',
      });
    }
  }

  const happyHandler = plainToInstance(HappyHandler, {});

  const sadCommandType = 'I_ALWAYS_FAIL_AT_EVERYTHING_I_DO';

  class SadHandler implements ICommandHandler {
    async handle({
      payload: {
        aggregateCompositeIdentifier: { type, id },
      },
    }: ICommandFsa) {
      return Promise.resolve(
        new TrueImpactError(
          `Failed as usual when attempting to update [${type}/${id}]`,
        ),
      );
    }
  }

  class SadCommand {
    static type = sadCommandType;

    aggregateCompositeIdentifier: CompositeIdentifier;
  }

  const sadHandler: ICommandHandler = plainToInstance(SadHandler, {});

  const mockResolver: ICommandHandlerResolver = {
    resolve: function (
      injectionToken: Ctor<ICommandHandler> | string,
      _scope?: COMMAND_EXECUTION_SCOPE,
    ): Promise<ICommandHandler> {
      if (injectionToken === HappyHandler) {
        return Promise.resolve(happyHandler);
      }

      if (injectionToken === SadHandler) {
        return Promise.resolve(sadHandler);
      }

      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Failed to inject a dependency of unknown type: ${typeof injectionToken === 'string' ? injectionToken : injectionToken.name}`,
        ),
      ]);
    },
  };

  describe(`when there is a handler for the given command`, () => {
    describe(`when the command succeeds`, () => {
      beforeAll(() => {
        commandHandlerService = new CommandHandlerService(mockResolver);

        commandHandlerService
          .register({
            CommandPayloadCtor: HappyCommand,
            CommandHandlerCtor: HappyHandler,
          })
          .register({
            CommandPayloadCtor: SadCommand,
            CommandHandlerCtor: SadHandler,
          });
      });

      it(`should return the expected acknowledgement`, async () => {
        const testId = '555';

        const testCommandFsa: ICommandFsa = {
          type: happyCommandType,
          payload: {
            aggregateCompositeIdentifier: {
              type: 'WIDGET',
              id: testId,
            },
          },
        };

        const result = await commandHandlerService.execute(testCommandFsa);

        expect(result).toEqual({
          id: testId,
          revision: dummyRevisionId,
          type: 'WIDGET',
        });
      });
    });

    describe(`when the command fails`, () => {
      beforeAll(() => {
        commandHandlerService = new CommandHandlerService(mockResolver);

        commandHandlerService.register({
          CommandPayloadCtor: SadCommand,
          CommandHandlerCtor: SadHandler,
        });
      });

      it(`should bubble up the command error`, async () => {
        const targetId = '555';

        const testCommandFsa: ICommandFsa = {
          type: sadCommandType,
          payload: {
            aggregateCompositeIdentifier: {
              type: 'widget',
              id: targetId,
            },
          },
        };

        const result = await commandHandlerService.execute(testCommandFsa);

        expect((result as TrueImpactError).toString()).toEqual(
          `Failed as usual when attempting to update [widget/555]`,
        );
      });
    });
  });

  describe(`when there is no handler for the given command`, () => {
    const service = new CommandHandlerService(mockResolver);

    const unknownCommandType = 'UNKNOWN_COMMAND_TYPE';

    const badFsa = {
      type: unknownCommandType,
      payload: {
        aggregateCompositeIdentifier: {
          type: 'widget',
          id: '123',
        },
      },
    };

    it(`should return the expected error`, async () => {
      const result = await service.execute(badFsa);

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message.toLowerCase()).toContain(
        `no command handler has been registered`,
      );
      expect(message).toContain(unknownCommandType);
    });
  });
});
