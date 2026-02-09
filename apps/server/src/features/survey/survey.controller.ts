import {
  BadUserInputFilter,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModel } from './queries/survey.view-model';

// TODO Can we wrap these into @Controller?
@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('surveys')
export class SurveyController {
  constructor(private readonly surveyQueryService: SurveyQueryService) {}

  @DetailQueryEndpoint()
  async fetchById(@IdParam() id: string): Promise<SurveyViewModel | null> {
    const result = await this.surveyQueryService.fetchById(id);

    return result;
  }
}
