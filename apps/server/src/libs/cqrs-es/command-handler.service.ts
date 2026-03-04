import {
  Ctor,
  getDataSchemaFromClassCtor,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
  validateObjectAgainstSchema,
} from '../data-types';
import { Injectable } from '../framework';
import {
  ICommandFsa,
  ICommandPayload,
} from './command-flux-standard-action.interface';
import { CommandResult, ICommandHandler } from './command-handler.interface';

export type COMMAND_EXECUTION_SCOPE = 'LIVE' | 'DRY_RUN';

interface HasStaticTypeDiscriminant {
  readonly type: string;
}

export interface ICommandHandlerResolver {
  resolve(
    injectionToken: Ctor<ICommandHandler> | string,
    scope?: COMMAND_EXECUTION_SCOPE,
  ): Promise<ICommandHandler>;
}

@Injectable()
export class CommandHandlerService {
  private readonly commandTypeToHandlers = new Map<
    string,
    Ctor<ICommandHandler>
  >();

  private readonly commandTypeToPayloads = new Map<
    string,
    Ctor<ICommandPayload>
  >();

  /**
   * This abstracts over the dependency-injection system. It hands over control of how to
   * construct an instance of the command handler (or cache these instances). This allows us to use
   * a strategy pattern for dry runs, or potentially to have tenant-scoped requests that
   * leverage different databases at run-time.
   */
  constructor(private readonly resolver: ICommandHandlerResolver) {}

  register({
    CommandPayloadCtor,
    CommandHandlerCtor,
  }: {
    // colloquially the 'command'
    CommandPayloadCtor: Ctor<ICommandPayload> & HasStaticTypeDiscriminant;
    CommandHandlerCtor: Ctor<ICommandHandler>;
  }): CommandHandlerService {
    const type = CommandPayloadCtor.type;

    if (this.commandTypeToHandlers.has(type)) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot register a duplicate handler for command of type [${type}]`,
        ),
      ]);
    }

    this.commandTypeToHandlers.set(type, CommandHandlerCtor);

    this.commandTypeToPayloads.set(type, CommandPayloadCtor);

    return this;
  }

  validate(userRequest: ICommandFsa): TrueImpactError[] {
    if (!userRequest) {
      return [
        new TrueImpactError(
          `Received an empty request body. You must provide a request of the form { type: string, payload: {...}} when executing commands.`,
        ),
      ];
    }

    const { type: commandType } = userRequest;

    const TargetHandlerCtor = this.commandTypeToHandlers.get(commandType);

    if (typeof TargetHandlerCtor === 'undefined') {
      return [
        new TrueImpactError(
          `No command handler has been registered for the command with type [${commandType}]`,
        ),
      ];
    }

    const CommandPayloadCtor = this.commandTypeToPayloads.get(commandType);

    if (typeof CommandPayloadCtor === 'undefined') {
      return [
        new TrueImpactError(
          `No command payload schema has been registered for command with type [${commandType}]`,
        ),
      ];
    }

    const validationResult = validateObjectAgainstSchema(
      userRequest.payload,
      getDataSchemaFromClassCtor(CommandPayloadCtor),
    );

    return validationResult;
  }

  async execute(userRequest: ICommandFsa): Promise<CommandResult> {
    const { type: commandType } = userRequest;

    const validationResult = this.validate(userRequest);

    if (validationResult.length > 0) {
      return this.buildTypeValidationError(validationResult);
    }

    const TargetHandlerCtor = this.commandTypeToHandlers.get(commandType);

    if (typeof TargetHandlerCtor === 'undefined') {
      return new TrueImpactError(
        `No command handler has been registered for the command with type [${commandType}]`,
      );
    }

    const handler = await this.resolver.resolve(TargetHandlerCtor);

    const executionResult =
      (await handler?.handle(userRequest)) ||
      new TrueImpactBadUserInputError([
        new TrueImpactError(
          `Failed to execute command of unknown type [${commandType}]`,
        ),
      ]);

    return executionResult;
  }

  private buildTypeValidationError(
    innerErrors: TrueImpactError[],
  ): TrueImpactBadUserInputError {
    return new TrueImpactBadUserInputError(innerErrors);
  }
}
