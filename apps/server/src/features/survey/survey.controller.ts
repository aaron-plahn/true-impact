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
  ApiOkResponse,
  BadUserInputFilter,
  Body,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  IndexQueryEndpoint,
  OnModuleInit,
  Post,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  TestSetupEndpoint,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModelClientDto } from './queries/survey.view-model';
import { SurveyEventsGateway } from './survey-events.gateway';

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
    /**
     * This doesn't belong here. In the long run, we want on out-of-band messaging queue
     * that will publish events async after the command ack \ nack has already been returned in-band.
     */
    private readonly eventPublisher: SurveyEventsGateway,
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

    // TODO The command handler needs a way to emit events.
    this.eventPublisher.publishEvent({
      type: 'SURVEY_UPDATED',
      payload: {
        ...result,
      },
    });

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

  // TODO @CommandExecutionEndpoint()
  @Post('commands')
  async executeCommand(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    if (!fsa) {
      throw new Error(`Missing fsa!`);
    }

    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }

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
    // TODO We should use reflection to find 1 and only 1 method decorated as `@CommandExecutionEndpoint`
    this.commandHandlerService.buildApiDocs(SurveyController, 'executeCommand');
  }
}
