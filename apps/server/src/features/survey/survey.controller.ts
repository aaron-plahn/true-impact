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
import { tiSduiToHtml } from '../../libs/server-driven-ui';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModelClientDto } from './queries/survey.view-model';
import { CommandSuccessPage } from './survey-completion/views';
import { CommandErrorPage } from './survey-completion/views/command-error-page';

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

  /**
   * TODO Commands should be part of a separate controller that can be deployed
   * and scaled independently from query endpoints. This allows us to leverage the
   * independent horizontal scaling of queries from commands that CQRS provides. It
   * also allows us to do things like shut-down command endpoints, putting our system in
   * a read-only state for certain deployment strategies or maintenance windows.
   */
  // TODO @CommandExecutionEndpoint()
  @Post('commands')
  async executeCommand(
    @Body() fsa: ICommandFsa,
    // @HashedPasscode() hashedAccessCode?: string,
  ): Promise<CommandResult> {
    if (!fsa) {
      throw new Error(`Missing fsa!`);
    }

    // if (hashedAccessCode && fsa.type === 'BEGIN_SURVEY') {
    //   Object.assign(fsa.payload, { hashedPasscode: hashedAccessCode });
    // }

    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }

  /**
   * Note that in the long run, we need to decide how to handle separating
   * - internal API (SDUI approach)
   * - external API (Data API)
   *
   * Currently, we only use the internal API for survey completion. This is because
   * there is a fundamentally different privacy model for survey completion. Often
   * participants are anonymous or known clients but not system users. As such, we
   * decided to go with a separate approach for this workflow, allowing for us to
   * experiment with alternative front-end architectures while at it.
   *
   * The benfit to the internal, SDUI approach is that we could in principle
   * write native iOS, Android, <insert platform> clients that interpret our
   * SDUI (JSON DSL) to UX without any domain knowledge.
   */
  @Post('commands-html')
  async executeCommandWithSduiResponse(@Body() fsa: ICommandFsa) {
    const result = await this.executeCommand(fsa);

    if (result instanceof TrueImpactError) {
      return tiSduiToHtml(
        new CommandErrorPage({
          fsa: fsa,
          error: new TrueImpactError(result.toString()),
        }).render(),
      );
    }

    return tiSduiToHtml(
      new CommandSuccessPage({
        commandType: fsa.type,
        aggregateCompositeIdentifier: {
          type: result.type,
          id: result.id,
        },
        revision: result.revision,
      }).render(),
    );
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
