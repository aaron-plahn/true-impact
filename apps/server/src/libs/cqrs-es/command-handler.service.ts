import {
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../data-types';
import { ICommandFsa } from './command-flux-standard-action.interface';
import { CommandResult, ICommandHandler } from './command-handler.interface';

export class CommandHandlerService {
  private readonly commandTypeToHandlers = new Map<string, ICommandHandler>();

  /**
   * It's possible that we want the `CommandHandlerService` to inject the repository so we can
   * have a "DryRun" option without needing request-scoped dependencies (and possible performance issues).
   */
  register({
    type,
    commandHandler,
  }: {
    type: string;
    commandHandler: ICommandHandler;
  }) {
    if (this.commandTypeToHandlers.has(type)) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot register a duplicate handler for command of type [${type}]`,
        ),
      ]);
    }

    this.commandTypeToHandlers.set(type, commandHandler);
  }

  async execute(userRequest: ICommandFsa): Promise<CommandResult> {
    const { type: commandType } = userRequest;

    const handler = this.commandTypeToHandlers.get(commandType);

    const result =
      (await handler
        // Or do we just want the payload here?
        ?.handle(userRequest)) ||
      new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to execute command of unknown type [${commandType}]`,
        ),
      ]);

    return result;
  }
}
