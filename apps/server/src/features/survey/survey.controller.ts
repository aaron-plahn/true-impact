import type { ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../libs/cqrs-es';
import {
  BadUserInputFilter,
  Body,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  IndexQueryEndpoint,
  Post,
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
  constructor(
    private readonly surveyQueryService: SurveyQueryService,
    private readonly commandHandlerService: CommandHandlerService,
  ) {}

  @DetailQueryEndpoint()
  // TODO every query should return a `ResultOrError`. This **could** be wrapped in a true `Either`.
  async fetchById(@IdParam() id: string): Promise<SurveyViewModel | null> {
    const result = await this.surveyQueryService.fetchById(id);

    return result;
  }

  @IndexQueryEndpoint()
  async fetchMany() {
    const result = await this.surveyQueryService.fetchMany();

    return result;
  }

  @Post('execute')
  async executeCommand(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    return this.commandHandlerService.execute(fsa);
  }
}
