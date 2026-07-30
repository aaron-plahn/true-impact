import type { ISurveyCommandRepository } from '../../../../../features/survey/repositories';
import { SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../../../../features/survey/survey-review';
import type {
  CommandResult,
  ICommandHandler,
} from '../../../../../libs/cqrs-es';
import { Inject } from '../../../../../libs/framework';
import { ImportSurvey } from './import-survey.command';

export class ImportSurveyCommandHandler implements ICommandHandler<ImportSurvey> {
  constructor(
    @Inject(SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly repository: ISurveyCommandRepository,
  ) {}

  handle(_fsa: { payload: ImportSurvey }): Promise<CommandResult> {
    throw new Error('Method not implemented.');
  }
}
