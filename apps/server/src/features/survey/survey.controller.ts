import { ForbiddenException, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DEFAULT_AUTH_TENANT } from 'src/auth/constants';
import { AdminRbacAuthGuard, OptionalUserGuard } from 'src/auth/guards';
import { SurveyCommandAuthGuard } from 'src/e2e/scenarios/surveys/guards';
import { Session } from 'supertokens-nestjs';
import { RecipeUserId } from 'supertokens-node';
import SessionRecipe, {
  type SessionContainer,
} from 'supertokens-node/recipe/session';
import { isDeepStrictEqual } from 'util';
import type { ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../libs/cqrs-es';
import {
  buildTestInstance,
  convertToOpenApiSchema,
  getDataSchemaFromClassCtor,
  isNonEmptyString,
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
import { tiSduiSectionToHtmlFragment } from '../../libs/server-driven-ui/html/tisdui-to-html-fragment';
import {
  SURVEY_AGGREGATE_TYPE,
  SURVEY_RESPONSE_AGGREGATE_TYPE,
} from './constants';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModelClientDto } from './queries/survey.view-model';
import { BeginSurvey } from './survey-completion';
import { BeginPublicSurvey } from './survey-completion/commands/begin-public-survey';
import { SduiViewDiffer } from './survey-completion/commands/sdui-view-differ';
import {
  AnonymousSurveyParticipantUser,
  SurveyResponseCompositeIdentifier,
} from './survey-completion/models';
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

  @UseGuards(AdminRbacAuthGuard)
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

  @UseGuards(AdminRbacAuthGuard)
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
  @UseGuards(OptionalUserGuard, SurveyCommandAuthGuard)
  @Post('commands')
  async executeCommand(
    @Body()
    fsa: ICommandFsa<{
      aggregateCompositeIdentifier?: { type: string; id: string };
    }>,
    // TODO inject the user instead
    @Session() session: SessionContainer,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommandResult | null> {
    if (!fsa) {
      throw new Error(`Missing fsa!`);
    }

    const accessTokenPayload = session?.getAccessTokenPayload() as
      | {
          subject: SurveyResponseCompositeIdentifier;
        }
      | undefined;

    // TODO think about the logic of this carefully
    // Note that BEGIN_SURVEY \ BEGIN_PUBLIC_SURVEY will not be handled here because it doesn't have an `aggregateCompositeIdentifier`
    if (
      fsa.payload.aggregateCompositeIdentifier &&
      fsa.payload.aggregateCompositeIdentifier.type ==
        SURVEY_RESPONSE_AGGREGATE_TYPE
    ) {
      const { user } = req as unknown as {
        user: AnonymousSurveyParticipantUser;
      };

      /**
       * The permissions model for survey completion allows users to exchange
       * an access code for access to a particular survey attempt (specified as the `subject` on the session).
       *
       * A better way to handle this is to inject a `user` model onto the session, allowing that the
       * user may be an `AnonymousSurveyParticipantUser` instead of a `TiSystemUser`.
       *
       * TODO Remove the subject or clear the session entirely after the survey is submitted.
       */
      if (!user || user.type !== 'ANONYMOUS_SURVEY_PARTICIPANT') {
        throw new ForbiddenException();
      }

      if (
        /**
         * We know that we have a non-empty `aggregateCompositeIdentifier` and that the `type`
         * is for a survey response. If the ID is invalid, no survey response will be updated.
         * So only if a valid ID is provided on the FSA **and** the signed cookie states that
         * the user has the authority to update that survey attempt will the request succeed.
         */
        !isDeepStrictEqual(fsa.payload.aggregateCompositeIdentifier, {
          type: SURVEY_RESPONSE_AGGREGATE_TYPE,
          id: user.surveyResponseId,
        })
      ) {
        throw new ForbiddenException();
      }
    }

    const isRequestToBeginSurvey =
      fsa.type === 'BEGIN_SURVEY' || fsa.type === 'BEGIN_PUBLIC_SURVEY';

    if (isRequestToBeginSurvey && session && accessTokenPayload?.subject) {
      /**
       * If the user has a different attempt in progress, we
       * need to remove authorization for this survey from the session
       * before starting a new session.
       */
      // await this.destroySession(session, req, res);
    }

    const result = await this.commandHandlerService.execute(fsa);

    if (!(result instanceof Error)) {
      if (isRequestToBeginSurvey) {
        const beginSurveyFsa = fsa as
          ICommandFsa<BeginSurvey> | ICommandFsa<BeginPublicSurvey>;

        if (accessTokenPayload?.subject) {
          throw new TrueImpactError(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `The previous session for attempt ${accessTokenPayload.subject.id} was not cleared ahead of starting survey ${result.id}`,
          );
        }

        try {
          if (!session) {
            if (!isNonEmptyString(beginSurveyFsa.payload.surveyId)) {
              throw new Error(
                `Invalid FSA encountered when creating a survey session.`,
              );
            }

            const { id: surveyAttemptId } = result;

            const subject = {
              type: SURVEY_RESPONSE_AGGREGATE_TYPE,
              id: surveyAttemptId,
            };

            const anonymousUserId = `survey-participant/${beginSurveyFsa.payload.surveyId}`;

            await SessionRecipe.createNewSession(
              req,
              res,
              DEFAULT_AUTH_TENANT,
              // TODO do we really need the subject below if we have a user ID like this?
              new RecipeUserId(anonymousUserId),
              {
                subject,
              },
              // We put the data only on the JWT for short-lived survey completion sessions
            );
          }
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
        await this.destroySession(session, req, res);

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
  @UseGuards(OptionalUserGuard, SurveyCommandAuthGuard)
  async executeCommandWithSduiResponse(
    @Body()
    fsa: ICommandFsa<{
      aggregateCompositeIdentifier?: { type: string; id: string };
    }>,
    @Session() session: SessionContainer,
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

  /**
   * TODO Find a different pattern for test cleanup. We do not want to introduce methods that have delete permissions on the
   * event store, even if they are only meant for development use, as these break logical append-only guarantees.
   * Other options:
   * 1. Each test runs in its own isolated database (this has worked in another project). The problem is that this
   * is not sufficient if test cases within the same suite step on each other's toes. And for each test **case**
   * to have its own DB would require a much larger number of databases.
   * 2. Each test must make its data unique so there's no chance of an accidental collision. While this
   * could work for UI e2e tests, any test that relies on `fetchMany` can't depend on this.
   * 3. Introduce soft deletes immediately. The problem with this is the tests will take a performance hit.
   * Also, this added complexity may cause tests to be more flakey due to needing to soft delete lots of data before
   * each run.
   * 4. Is there a way to "truncate" without data loss at the database level?
   */
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
    await this.surveyQueryService.surveyCommandRepository.clear(
      SURVEY_AGGREGATE_TYPE,
    );

    return 'OK';
  }

  // TODO we will need to manage these sessions using Supertokens now
  private async destroySession(
    @Session() session: SessionContainer,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('survey-response-session'); // wait is this still the cookie?
    // TODO is there a more idiomatic way to do this with supertokens?
    res.clearCookie('sAccessToken');
    res.clearCookie('sRefreshToken');

    delete (req as unknown as { user: unknown }).user;

    await session?.revokeSession();
  }

  onModuleInit() {
    // TODO We should use reflection to find 1 and only 1 method decorated as `@CommandExecutionEndpoint`
    this.commandHandlerService.buildApiDocs(SurveyController, 'executeCommand');
  }
}
