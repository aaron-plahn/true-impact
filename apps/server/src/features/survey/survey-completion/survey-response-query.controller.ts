import { Session } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import {
  buildTestInstance,
  convertToOpenApiSchema,
  getDataSchemaFromClassCtor,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../libs/data-types';
import {
  BadUserInputFilter,
  Controller,
  DetailQueryEndpoint,
  Get,
  IdParam,
  IndexQueryEndpoint,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  TestSetupEndpoint,
  UseFilters,
  UseInterceptors,
} from '../../../libs/framework';
import { tiSduiToHtml } from '../../../libs/server-driven-ui';
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from '../constants';
import { SurveyQueryService } from '../queries/survey-query.service';
import { SurveyResponseQueryService } from './queries';
import { SurveyResponseRecordViewModelClientDto } from './queries/survey-response-record.view-model';
import { BeginSurveyPage } from './views';
import { SubmitSurveyPage } from './views/submit-survey.page';
import { SurveyCompletionAcknowledgementPage } from './views/survey-completion-acknowledgement-page';
import { SurveyQuestionCompletionPage } from './views/survey-question-completion-page';

const schema = convertToOpenApiSchema(
  getDataSchemaFromClassCtor(SurveyResponseRecordViewModelClientDto),
);

const example = buildTestInstance(SurveyResponseRecordViewModelClientDto);

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('surveys/responses')
export class SurveyResponseQueryController {
  constructor(
    private readonly surveyCompletionQueryService: SurveyResponseQueryService,
    private readonly surveyQueryService: SurveyQueryService,
  ) {}

  // commands are routed through the base /surveys command controller

  @Get('begin/:id')
  async beginSurvey(@IdParam() surveyId: string) {
    const targetSurvey = await this.surveyQueryService.fetchById(surveyId);

    if (!targetSurvey) {
      return null;
    }

    if (targetSurvey instanceof Error) {
      return 'TODO Error Response';
    }

    const { isOpenToPublic } = targetSurvey;

    const dataView = new BeginSurveyPage({
      id: surveyId,
      name: targetSurvey.name,
      isOpenToPublic,
    });

    const sduiView = dataView.render();

    const htmlView = tiSduiToHtml(sduiView);

    return htmlView;
  }

  // TODO Expose lists of surveys that are publicly available.
  // TODO Expose links to surveys that are available, subject to possession of a
  // @Get('participate')
  // async chooseSurveyToComplete() {
  //   // TODO Put `fetchAvailableSurveys()` on the survey query service
  //   const available = await this.surveyQueryService.fetchAvailable();

  //   if (available instanceof Error) {
  //     return `<div>Failed to fetch a list of available surveys from the database. Please try again!</div>`;
  //   }

  //   /**
  //    * Eventually, we may want to inject the user context to make this decision.
  //    */

  //   const sdui = new SurveyIndexPage({
  //     entities: available,
  //   }).render();

  //   return tiSduiToHtml(sdui);
  // }

  @Get('participate/:id')
  async participate(
    @IdParam() attemptId: string,
    @Session() session: Record<string, any>,
  ) {
    /**
     * TODO Move this logic to a route guard
     * @SurveyResponseGuard()
     */
    if (!session.subject) {
      // TODO return null
      return `<div>Missing session subject!</div>`; // null;
    }

    if (
      (session.subject as { type: string }).type !==
      SURVEY_RESPONSE_AGGREGATE_TYPE
    ) {
      return null;
    }

    if ((session.subject as { id: string }).id !== attemptId) {
      //  TODO return null
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return `<div>You don't have permission for this particular survey! you can see: ${session.subject.id}</div>`;
    }

    const target = await this.fetchCompletionByAttemptId(attemptId);

    if (target === null) {
      return `<div>Not Found</div>`;
    }

    const { nextQuestion, hasBeenSubmitted } = target;

    if (hasBeenSubmitted) {
      const sdui = new SurveyCompletionAcknowledgementPage({
        name: attemptId,
      }).render();

      return tiSduiToHtml(sdui);
    }

    if (nextQuestion === null) {
      const sdui = new SubmitSurveyPage({ id: attemptId }).render();

      return tiSduiToHtml(sdui);
    }

    const sduiView = new SurveyQuestionCompletionPage({
      question: nextQuestion,
      attemptId,
    });

    return tiSduiToHtml(sduiView.render());
  }

  @IndexQueryEndpoint()
  @ApiOkResponse({
    schema,
    example: [example],
  })
  fetchCompletionAttempts() {
    return this.surveyCompletionQueryService.fetchMany();
  }

  @DetailQueryEndpoint()
  @ApiOkResponse({
    schema,
    example,
  })
  // TODO route guards
  fetchCompletionByAttemptId(@IdParam() id: string) {
    return this.surveyCompletionQueryService.fetchById(id);
  }

  // TODO support filters to fetch completion attempts for participant of a given type, for a given survey, etc.

  // TODO auth guard
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
    await this.surveyCompletionQueryService.surveyCompletionCommandRepository.clear();

    return 'OK';
  }
}
