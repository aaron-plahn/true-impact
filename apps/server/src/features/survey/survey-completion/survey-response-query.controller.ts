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
import { SurveyQueryService } from '../queries/survey-query.service';
import { SurveyResponseQueryService } from './queries';
import { SurveyResponseRecordViewModelClientDto } from './queries/survey-response-record.view-model';
import { BeginSurveyPage } from './views';
import { SubmitSurveyPage } from './views/submit-survey.page';
import { SurveyCompletionAcknowledgementPage } from './views/survey-completion-acknowledgement-page';
import { SurveyIndexPage } from './views/survey-index-page';
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
  beginSurvey(@IdParam() surveyId: string) {
    const dataView = new BeginSurveyPage({ id: surveyId, name: 'Aro Survey' });

    const sduiView = dataView.render();

    const htmlView = tiSduiToHtml(sduiView);

    return htmlView;
  }

  @Get('participate')
  async chooseSurveyToComplete() {
    // TODO Put `fetchAvailableSurveys()` on the survey query service
    const available = await this.surveyQueryService.fetchAvailable();

    if (available instanceof Error) {
      return `<div>Failed to fetch a list of available surveys from the database. Please try again!</div>`;
    }

    /**
     * Eventually, we may want to inject the user context to make this decision.
     */

    const sdui = new SurveyIndexPage({
      entities: available,
    }).render();

    return tiSduiToHtml(sdui);
  }

  @Get('participate/:id')
  async participate(@IdParam() attemptId: string) {
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

  @Get('test-ws')
  testWS() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WSs are dope!</title>
        
    </head>
    <body>
        <p id="root">Loading</p>
        <p id="BEGIN_SURVEY_1">PLACEHOLDER</p>
        <button id="send-button">SEND</button>
        <script src="https://cdn.socket.io/3.1.3/socket.io.min.js" integrity="sha384-cPwlPLvBTa3sKAgddT6krw0cJat7egBga3DJepJyrLl4Q9/5WLra3rrnMcyTyOnh" crossorigin="anonymous"></script>
        <script>
          const target = document.getElementById('root');

          const wsUri = 'ws://localhost:3234/survey-events';
          const socket = io(wsUri, { transports: ['websocket'], autoConnect: true });

          const send = () =>{
            socket.emit("SOME_EVENT",{message: 'Another one bites the dust!'});

            console.log("EMITTED");
          };

          socket.on('connect', () => {
            document.getElementById("send-button").addEventListener("click",send);

            send();
          });

          socket.on('SOME_EVENT', ({ message }) => {
            target.innerHTML += ", " +message;
          });

          socket.on('SURVEY_UPDATED', (e)=>{
            console.log({updatedWith: e});

            const elToUpdate = document.getElementById(e.target);

            if(!elToUpdate){
              throw new Error('Failed to update target element with ID:' + e.target)
            }

            if(e.swap === "outer"){
              elToUpdate.outerHTML = e.content;
              return;
            }

            console.log({unsupportedEvent: e});
          })
        </script>
    </body>
    </html>
      `;
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
  fetchCompletionByAttemptId(@IdParam() id: string) {
    return this.surveyCompletionQueryService.fetchById(id);
  }

  // TODO support filters to fetch completion attempts for participant of a given type, for a given survey, etc.

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
    await this.surveyCompletionQueryService.surveyCompletionCommandRepository.clear();

    return 'OK';
  }
}
