import { CommandResult, ICommandHandler } from 'src/libs/cqrs-es';
import { PublishSurvey } from './publish-survey.command';

export class PublishSurveyCommandHandler implements ICommandHandler {
  handle(_fsa: { payload: PublishSurvey }): Promise<CommandResult> {
    throw new Error('Method not implemented.');
  }
}
