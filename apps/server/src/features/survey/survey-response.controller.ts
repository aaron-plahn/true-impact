import { ApiOkResponse } from '@nestjs/swagger';
import {
  buildTestInstance,
  convertToOpenApiSchema,
  getDataSchemaFromClassCtor,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import {
  BadUserInputFilter,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  IndexQueryEndpoint,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  TestSetupEndpoint,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';
import { SurveyResponseQueryService } from './survey-completion/queries';
import { SurveyResponseRecordViewModelClientDto } from './survey-completion/queries/survey-response-record.view-model';

const schema = convertToOpenApiSchema(
  getDataSchemaFromClassCtor(SurveyResponseRecordViewModelClientDto),
);

const example = buildTestInstance(SurveyResponseRecordViewModelClientDto);

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('surveys/responses')
export class SurveyResponseController {
  constructor(
    private readonly surveyCompletionQueryService: SurveyResponseQueryService,
  ) {}

  // commands are routed through the base /surveys endpoint

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
