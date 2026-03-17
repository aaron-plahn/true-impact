import {
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
import { SurveyReviewQueryService } from './survey-review/queries/survey-review-query.service';

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('surveys/reviews')
export class SurveyReviewController {
  constructor(
    private readonly surveyReviewQueryService: SurveyReviewQueryService,
  ) {}

  @DetailQueryEndpoint()
  async fetchById(@IdParam() id: string) {
    const result = await this.surveyReviewQueryService.fetchById(id);

    return result;
  }

  @IndexQueryEndpoint()
  async fetchMany() {
    const result = await this.surveyReviewQueryService.fetchMany();

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
    await this.surveyReviewQueryService.surveyReviewCommandRepository.clear();

    return 'OK';
  }
}
