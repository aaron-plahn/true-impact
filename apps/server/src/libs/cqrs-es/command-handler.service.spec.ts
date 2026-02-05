import { TrueImpactError } from '../data-types';
import { ICommandFsa } from './command-flux-standard-action.interface';
import { ICommandHandler } from './command-handler.interface';
import { CommandHandlerService } from './command-handler.service';
import { AGGREGATE_COMPOSITE_IDENTIFIER } from './constants';

describe(`CommandHandlerService`, () => {
  let commandHandlerService: CommandHandlerService;

  describe(`when there is a handler for the given command`, () => {
    describe(`when the command succeeds`, () => {
      const happyCommandType = 'YES_MAN_COMMAND';

      const dummyRevisionId = '1';

      const happyHandler: ICommandHandler = {
        // Do we want `execute` here instead?
        handle({
          payload: {
            aggregateCompositeIdentifier: { id },
          },
        }: ICommandFsa) {
          return Promise.resolve({
            id,
            revision: dummyRevisionId,
          });
        },
      };

      beforeAll(() => {
        commandHandlerService = new CommandHandlerService();

        commandHandlerService.register({
          type: happyCommandType,
          commandHandler: happyHandler,
        });
      });

      it(`should return the expected acknowledgement`, async () => {
        const testId = '555';

        const testCommandFsa: ICommandFsa = {
          type: happyCommandType,
          payload: {
            [AGGREGATE_COMPOSITE_IDENTIFIER]: {
              type: 'WIDGET',
              id: testId,
            },
          },
        };

        const result = await commandHandlerService.execute(testCommandFsa);

        expect(result).toEqual({
          id: testId,
          revision: dummyRevisionId,
        });
      });
    });

    describe(`when the command fails`, () => {
      const sadCommandType = 'I_ALWAYS_FAIL_AT_EVERYTHING_I_DO';

      const sadHandler: ICommandHandler = {
        // Do we want `execute` here instead?
        handle({
          payload: {
            aggregateCompositeIdentifier: { type, id },
          },
        }: ICommandFsa) {
          return Promise.resolve(
            new TrueImpactError(
              `Failed as usual when attempting to update [${type}/${id}]`,
            ),
          );
        },
      };

      beforeAll(() => {
        commandHandlerService = new CommandHandlerService();

        commandHandlerService.register({
          type: sadCommandType,
          commandHandler: sadHandler,
        });
      });

      it(`should bubble up the command error`, async () => {
        const targetId = '555';

        const testCommandFsa: ICommandFsa = {
          type: sadCommandType,
          payload: {
            [AGGREGATE_COMPOSITE_IDENTIFIER]: {
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
    const service = new CommandHandlerService();

    const unknownCommandType = 'UNKNOWN_COMMAND_TYPE';

    const badFsa = {
      type: unknownCommandType,
      payload: {
        // do we really want this? can't we get intellisence without the constant?
        [AGGREGATE_COMPOSITE_IDENTIFIER]: {
          type: 'widget',
          id: '123',
        },
      },
    };

    it(`should return the expected error`, async () => {
      const result = await service.execute(badFsa);

      expect(result).toBeInstanceOf(TrueImpactError);

      const message = (result as TrueImpactError).toString();

      expect(message).toContain(`unknown type`);
      expect(message).toContain(unknownCommandType);
    });
  });
});
