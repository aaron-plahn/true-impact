import { OnModuleInit } from '@nestjs/common';
import { CommandHandlerService } from 'src/libs/cqrs-es';
import { Module } from '../../libs';
import { AddQuestionToSurveyCommandHandler } from './commands/add-question-to-survey.command-handler';
import { Survey } from './survey.aggregate-root';

const dataClasses = [Survey];

@Module({
  providers: [
    /**
     * Exporting
     */
    ...dataClasses.map((Ctor) => ({
      provide: Ctor,
      useValue: Ctor,
    })),
  ],
  // Exposing data classes allows us to drive them via repl
  exports: [...dataClasses],
})
export class SurveyModule implements OnModuleInit {
  constructor(private readonly commandHandlerService: CommandHandlerService) {}

  onModuleInit() {
    this.commandHandlerService.register({
      type: 'CREATE_SURVEY',
      CommandHandlerCtor: AddQuestionToSurveyCommandHandler,
      // dryRunHandler
    });
  }
}
