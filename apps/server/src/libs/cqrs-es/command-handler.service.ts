import {
  Ctor,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../data-types';
import { ICommandFsa } from './command-flux-standard-action.interface';
import { CommandResult, ICommandHandler } from './command-handler.interface';

export type COMMAND_EXECUTION_SCOPE = 'LIVE' | 'DRY_RUN';

interface ICommandHandlerResolver {
  resolve(
    injectionToken: Ctor<ICommandHandler> | string,
    scope?: COMMAND_EXECUTION_SCOPE,
  ): Promise<ICommandHandler>;
}

export class CommandHandlerService {
  private readonly commandTypeToHandlers = new Map<
    string,
    Ctor<ICommandHandler>
  >();

  constructor(private readonly resolver: ICommandHandlerResolver) {}

  /**
   * It's possible that we want the `CommandHandlerService` to inject the repository so we can
   * have a "DryRun" option without needing request-scoped dependencies (and possible performance issues).
   */
  register({
    type,
    CommandHandlerCtor,
  }: {
    type: string;
    CommandHandlerCtor: Ctor<ICommandHandler>;
  }): CommandHandlerService {
    if (this.commandTypeToHandlers.has(type)) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot register a duplicate handler for command of type [${type}]`,
        ),
      ]);
    }

    this.commandTypeToHandlers.set(type, CommandHandlerCtor);

    // fluent chaining
    return this;
  }

  async execute(userRequest: ICommandFsa): Promise<CommandResult> {
    const { type: commandType } = userRequest;

    const TargetHandlerCtor = this.commandTypeToHandlers.get(commandType);

    if (typeof TargetHandlerCtor === 'undefined') {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `No command handler has been registered for the commadn with type [${commandType}]`,
        ),
      ]);
    }

    const handler = await this.resolver.resolve(TargetHandlerCtor);

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
