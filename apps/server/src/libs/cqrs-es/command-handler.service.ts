import { ApiBody } from '@nestjs/swagger';
import {
  AnswerSurveyQuestion,
  BeginSurvey,
} from 'src/features/survey/survey-completion';
import {
  buildTestInstance,
  convertToOpenApiSchema,
  Ctor,
  DataSchema,
  EnumeratedTypeSchemaPropertyMetadata,
  getDataSchemaFromClassCtor,
  TrueImpactBadUserInputError,
  TrueImpactError,
  TrueImpactRuntimeException,
  validateObjectAgainstSchema,
} from '../data-types';
import { ExampleObject } from '../data-types/schema-management/utilities/open-api-spec.interface';
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
  constructor(
    private readonly resolver: ICommandHandlerResolver,
    /**
     * This doesn't belong here. In the long run, we want on out-of-band messaging queue
     * that will publish events async after the command ack \ nack has already been returned in-band.
     */
    private readonly eventPublisher: {
      publishEvent: (event: unknown) => Promise<void>;
    },
  ) {}

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

    if (!(executionResult instanceof Error)) {
      const aggregateCompositeIdentifier = {
        id: executionResult.id,
        type: executionResult.type,
      };

      /**
       * Better patterns
       * 1. Make the command handler responsible for `buildEvent` and publish
       * the event after writing to the event store (domain DB).
       * 2. (Better yet) Pull events from the event store and publish
       * via a proper messaging queue for more robustness.
       */
      if (commandType === 'BEGIN_SURVEY') {
        this.eventPublisher.publishEvent({
          type: 'SURVEY_BEGAN',
          payload: {
            aggregateCompositeIdentifier,
            surveyId: (userRequest.payload as BeginSurvey).surveyId,
          },
        });
      }

      if (commandType === 'ANSWER_SURVEY_QUESTION') {
        const { questionLabel, chosenOptionLabel } =
          userRequest.payload as AnswerSurveyQuestion;

        this.eventPublisher.publishEvent({
          type: 'SURVEY_QUESTION_ANSWERED',
          payload: {
            aggregateCompositeIdentifier,
            questionLabel,
            chosenOptionLabel,
          },
        });
      }

      if (commandType === 'SUBMIT_SURVEY') {
        this.eventPublisher.publishEvent({
          type: 'SURVEY_SUBMITTED',
          payload: {
            aggregateCompositeIdentifier,
          },
        });
      }
    }

    return executionResult;
  }

  getCommandFsaSchemas(): (DataSchema<ICommandFsa> & {
    examples: ICommandFsa[];
  })[] {
    const schemas: (DataSchema<ICommandFsa> & {
      examples: ICommandFsa[];
    })[] = [];

    this.commandTypeToPayloads.forEach((Ctor, commandType) => {
      const fsaTypePropertySchema: EnumeratedTypeSchemaPropertyMetadata = {
        type: 'ENUMERATED_TYPE',
        isOptional: false,
        label: 'command type',
        description: 'Specifies the command you would like to execute.',
        enum: [],
        valuesAndLabels: {
          type: commandType,
        },
      };

      const schemaForFsa = {
        properties: {
          type: fsaTypePropertySchema,
          payload: {
            type: 'object',
            getCtor: () => Ctor,
          },
        },
        /**
         * TODO Eventually we should support registering multiple named examples in our
         * codebase.
         */
        examples: {
          default: buildTestInstance(Ctor),
        },
      };

      schemas.push(
        schemaForFsa as unknown as DataSchema<ICommandFsa> & {
          examples: ICommandFsa[];
        },
      );
    });

    return schemas;
  }

  buildApiDocs(
    Controller: Ctor,
    commandExecutionMethodName = 'executeCommand',
  ) {
    const rawSchemas = this.getCommandFsaSchemas();

    const commandFsaSchemasInOpenApiFormat = rawSchemas.map(
      convertToOpenApiSchema,
    );

    const examples: Record<string, ExampleObject> = {};

    const classNameByDiscriminantType: Record<string, string> = {};

    rawSchemas.forEach((s) => {
      Object.entries(s.examples).forEach(([exampleName, example]) => {
        const proto = Object.getPrototypeOf(example) as object;

        const commandType = proto.constructor['type'] as string;

        examples[`${commandType} - [${exampleName}]`] = {
          value: {
            type: commandType,
            payload: example,
          },
        };

        // @ts-expect-error We don't need type safety in this meta-programming layer. If this fails, the app will blow up during bootstrap.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const discriminant: string = proto.constructor.type;

        classNameByDiscriminantType[discriminant] = proto.constructor.name;
      });
    });

    ApiBody({
      examples,
      schema: {
        oneOf: commandFsaSchemasInOpenApiFormat,
        properties: {
          type: {
            type: 'string',
          },
        },
        /**
         * TODO This is not showing up properly in Swagger UI, although
         * the examples come through paired with the command type, the schemas are still a union.
         */
        discriminator: {
          propertyName: 'type',
          mapping: classNameByDiscriminantType,
        },
      },
    })(
      Controller.prototype as object,
      commandExecutionMethodName,
      Object.getOwnPropertyDescriptor(
        Controller.prototype,
        commandExecutionMethodName,
      ) as PropertyDescriptor,
    );
  }

  private buildTypeValidationError(
    innerErrors: TrueImpactError[],
  ): TrueImpactBadUserInputError {
    return new TrueImpactBadUserInputError(innerErrors);
  }
}
