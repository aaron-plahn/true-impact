import { CommandHandlerService } from '../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import {
  BadUserInputFilter,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  Patch,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';
import { SurveyCompletionQueryService } from './survey-completion/queries';

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('surveys/responses')
export class SurveyCompletionController {
  constructor(
    private readonly surveyCompletionQueryService: SurveyCompletionQueryService,
    private readonly commandHandlerService: CommandHandlerService,
  ) {}

  // commands are routed through the base /surveys endpoint

  @DetailQueryEndpoint()
  fetchCompletionByAttemptId(@IdParam() id: string) {
    return this.surveyCompletionQueryService.fetchById(id);
  }

  // fetch all completion attempts

  // fetch completion attempts for participant of type

  @Patch('test-setup')
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
