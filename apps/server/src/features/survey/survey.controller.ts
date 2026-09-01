import {
  ForbiddenException,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthenticatedUserGuard, RbacAuthGuard } from 'src/auth/guards';
import { SurveyCommandAuthGuard } from 'src/e2e/scenarios/surveys/guards';
import { tiSduiSectionToHtmlFragment } from 'src/libs/server-driven-ui/html/tisdui-to-html-fragment';
import { isDeepStrictEqual } from 'util';
import type { ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../libs/cqrs-es';
import {
  buildTestInstance,
  convertToOpenApiSchema,
  getDataSchemaFromClassCtor,
  ResourceNotFoundError,
  TrueImpactBadUserInputError,
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
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from './constants';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModelClientDto } from './queries/survey.view-model';
import { SduiViewDiffer } from './survey-completion/commands/sdui-view-differ';
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
    // TODO naming
    private readonly surveyResponseViewDiffer: SduiViewDiffer,
  ) {}

  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @DetailQueryEndpoint()
  @ApiOkResponse({
    schema,
    example,
  })
  // TODO every query should return a `ResultOrError`. This **could** be wrapped in a true `Either`.
  async fetchById(
    @IdParam() id: string,
  ): Promise<SurveyViewModelClientDto | TrueImpactError | null> {
    const result = await this.surveyQueryService.fetchById(id);

    return result;
  }

  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
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
  // @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @UseGuards(SurveyCommandAuthGuard)
  @Post('commands')
  async executeCommand(
    @Body()
    fsa: ICommandFsa<{
      aggregateCompositeIdentifier?: { type: string; id: string };
    }>,
    // TODO inject the user instead
    @Session() session: Record<string, any>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommandResult | null> {
    if (!fsa) {
      throw new Error(`Missing fsa!`);
    }

    // TODO think about the logic of this carefully
    // Note that BEGIN_SURVEY \ BEGIN_PUBLIC_SURVEY will not be handled here because it doesn't have an `aggregateCompositeIdentifier`
    if (
      fsa.payload.aggregateCompositeIdentifier &&
      fsa.payload.aggregateCompositeIdentifier.type ==
        SURVEY_RESPONSE_AGGREGATE_TYPE
    ) {
      /**
       * The permissions model for survey completion allows users to exchange
       * an access code for access to a particular survey attempt (specified as the `subject` on the session).
       *
       * A better way to handle this is to inject a `user` model onto the session, allowing that the
       * user may be an `AnonymousSurveyParticipantUser` instead of a `TiSystemUser`.
       *
       * TODO Remove the subject or clear the session entirely after the survey is submitted.
       */
      if (!session) {
        throw new ForbiddenException();
      }

      if (
        /**
         * We know that we have a non-empty `aggregateCompositeIdentifier` and that the `type`
         * is for a survey response. If the ID is invalid, no survey response will be updated.
         * So only if a valid ID is provided on the FSA **and** the signed cookie states that
         * the user has the authority to update that survey attempt will the request succeed.
         */
        !isDeepStrictEqual(
          fsa.payload.aggregateCompositeIdentifier,
          session.subject,
        )
      ) {
        throw new ForbiddenException();
      }
    }

    const isRequestToBeginSurvey =
      fsa.type === 'BEGIN_SURVEY' || fsa.type === 'BEGIN_PUBLIC_SURVEY';

    if (isRequestToBeginSurvey && session && session.subject) {
      /**
       * If the user has a different attempt in progress, we
       * need to remove authorization for this survey from the session
       * before starting a new session.
       */
      delete session.subject;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      session.save();
    }

    const result = await this.commandHandlerService.execute(fsa);

    if (!(result instanceof Error)) {
      if (fsa.type === 'BEGIN_SURVEY' || fsa.type === 'BEGIN_PUBLIC_SURVEY') {
        if (session.subject) {
          throw new TrueImpactError(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `The previous session for attempt ${session.subject.id} was not cleared ahead of starting survey ${result.id}`,
          );
        }

        session.subject = {
          type: SURVEY_RESPONSE_AGGREGATE_TYPE,
          id: result.id,
        };

        try {
          req.session.save((err) => {
            throw new TrueImpactRuntimeException([
              new TrueImpactError(`Failed to persist survey response session.`),
              new TrueImpactError(
                (err as { message?: string }).message || 'Unknown Error',
              ),
            ]);
          });
        } catch (_error) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          throw new Error(_error.toString());
        }

        return result;
      }

      if (fsa.type === 'SUBMIT_SURVEY') {
        /**
         * Submitting a survey successfully amounts to logging out of the session
         * to complete a survey.
         */
        this.destroySession(session, req, res);

        return result;
      }

      return result;
    }

    if (result instanceof ResourceNotFoundError) {
      return null;
    }

    // TODO sort out where we wrap this in
    if (!(result instanceof TrueImpactBadUserInputError)) {
      return new TrueImpactBadUserInputError([result]);
    }

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
  @UseGuards(SurveyCommandAuthGuard)
  async executeCommandWithSduiResponse(
    @Body()
    fsa: ICommandFsa<{
      aggregateCompositeIdentifier?: { type: string; id: string };
    }>,
    // TODO inject the user instead
    @Session() session: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.executeCommand(fsa, session, req, res);

    const commandErrorPage = new CommandErrorPage({
      fsa: fsa,
      error: result
        ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
          new TrueImpactError(result.toString())
        : new TrueImpactError('Not Found'),
    });

    if (result instanceof TrueImpactError || result === null) {
      return {
        target: 'root',
        swap: 'outer',
        content: commandErrorPage.render(),
      };
    }

    const { events } = result;

    if (!events || events.length === 0) {
      return tiSduiToHtml(
        // TODO this should be a SDUI diff
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

    if (events.length === 1) {
      const diff = await this.surveyResponseViewDiffer.calculateDiff(events[0]);

      if (!diff) {
        throw new Error(`Not implemented: null view updates`);
      }

      return {
        target: diff.target,
        swap: diff.swap,
        content: tiSduiSectionToHtmlFragment(diff?.content),
      };
    }

    // if (events.length > 1)
    throw new TrueImpactRuntimeException([
      new TrueImpactError(
        `A command of type ${fsa.type} emitted multiple events (${(events || []).map((e) => e.type).join(', ')}). \n This is not currently supported within the system.`,
      ),
    ]);
  }

  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @TestSetupEndpoint()
  async testSetup(): Promise<'OK'> {
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'e2e') {
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

  private destroySession(
    @Session() session: Record<string, any>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    session.subject = null;

    res.clearCookie('survey-response-session');

    req.session.destroy((err) => {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(`Logout failed after submitting a survey`),
        new TrueImpactError(
          (err as { message?: string })?.message || 'Unknown error',
        ),
      ]);
    });
  }

  onModuleInit() {
    // TODO We should use reflection to find 1 and only 1 method decorated as `@CommandExecutionEndpoint`
    this.commandHandlerService.buildApiDocs(SurveyController, 'executeCommand');
  }
}
