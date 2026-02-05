import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import { AddQuestionToSurvey } from './add-question-to-survey.command';

export class AddQuestionToSurveyCommandHandler implements ICommandHandler<AddQuestionToSurvey> {
  handle(_fsa: { payload: AddQuestionToSurvey }): Promise<CommandResult> {
    throw new Error('Method not implemented.');
  }
}
