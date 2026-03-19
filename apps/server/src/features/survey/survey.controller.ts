/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { OnModuleInit } from '@nestjs/common';
import { ApiBody, ApiOkResponse } from '@nestjs/swagger';
import {
  ExampleObject,
  ExamplesObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import type { ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../libs/cqrs-es';
import {
  buildTestInstance,
  convertToOpenApiSchema,
  getDataSchemaFromClassCtor,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import {
  BadUserInputFilter,
  Body,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  IndexQueryEndpoint,
  Post,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  TestSetupEndpoint,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModelClientDto } from './queries/survey.view-model';

const schema = convertToOpenApiSchema(
  getDataSchemaFromClassCtor(SurveyViewModelClientDto),
);

const example = buildTestInstance(SurveyViewModelClientDto);

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('surveys')
export class SurveyController implements OnModuleInit {
  constructor(
    private readonly surveyQueryService: SurveyQueryService,
    private readonly commandHandlerService: CommandHandlerService,
  ) {}

  @DetailQueryEndpoint()
  @ApiOkResponse({
    schema,
    example,
  })
  // TODO every query should return a `ResultOrError`. This **could** be wrapped in a true `Either`.
  async fetchById(
    @IdParam() id: string,
  ): Promise<SurveyViewModelClientDto | TrueImpactError> {
    const result = await this.surveyQueryService.fetchById(id);

    return result;
  }

  @IndexQueryEndpoint()
  @ApiOkResponse({
    schema,
    example,
    isArray: true,
  })
  async fetchMany() {
    const result = await this.surveyQueryService.fetchMany();

    return result;
  }

  @Post('commands')
  async executeCommand(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }

  // TODO Opt out of API docs for this one
  @TestSetupEndpoint()
  async testSetup(): Promise<'OK'> {
    if (process.env.NODE_ENV !== 'test') {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot access test setup helpers in the environment [${process.env.NODE_ENV}]`,
        ),
      ]);
    }

    // @ts-expect-error This will only work if the private, concrete dependency has a `clear` method (not for the production implementation)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.surveyQueryService.surveyCommandRepository.clear();

    return 'OK';
  }

  onModuleInit() {
    const rawSchemas = this.commandHandlerService.getCommandFsaSchemas();

    const commandFsaSchemasInOpenApiFormat = rawSchemas.map(
      convertToOpenApiSchema,
    );

    const examples: Record<string, ExampleObject> = {};

    rawSchemas.forEach((s) => {
      Object.entries(s.examples).forEach(([exampleName, example]) => {
        const proto = Object.getPrototypeOf(example);

        const commandType = proto.constructor['type'];

        examples[`${commandType} - [${exampleName}]`] = {
          value: {
            type: commandType,
            payload: example,
          },
        };
      });
    });

    ApiBody({
      examples: examples as unknown as ExamplesObject,
      schema: {
        oneOf: commandFsaSchemasInOpenApiFormat,
      },
    })(
      SurveyController.prototype,
      'executeCommand',
      Object.getOwnPropertyDescriptor(
        SurveyController.prototype,
        'executeCommand',
      ) as PropertyDescriptor,
    );
  }
}
