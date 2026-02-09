import { OnModuleInit } from '@nestjs/common';
import { CommandsModule } from 'src/common/commands/commands.module';
import { InMemoryQueryRepositoryProvider } from 'src/common/persistence';
import { CommandHandlerService } from 'src/libs/cqrs-es';
import { Module } from '../../libs';
import { AddQuestionToSurvey } from './commands/add-question-to-survey.command';
import { AddQuestionToSurveyCommandHandler } from './commands/add-question-to-survey.command-handler';
import { CreateSurvey } from './commands/create-survey.command';
import { CreateSurveyCommandHandler } from './commands/create-survey.command-handler';
import { SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN } from './queries/survey-query-repository.interface';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModel } from './queries/survey.view-model';
import { Survey } from './survey.aggregate-root';
import { SurveyController } from './survey.controller';

const dataClasses = [Survey, CreateSurvey];

@Module({
  imports: [CommandsModule],
  providers: [
    CreateSurveyCommandHandler,
    SurveyQueryService,
    {
      provide: SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN,
      useValue: new InMemoryQueryRepositoryProvider().forFeature(
        SurveyViewModel,
      ),
    },
    /**
     * TODO Include a separate property for these in the module options
     */
    ...dataClasses.map((Ctor) => ({
      provide: Ctor,
      useValue: Ctor,
    })),
  ],
  // Exposing data classes allows us to drive them via repl
  exports: [...dataClasses],
  controllers: [SurveyController],
})
export class SurveyModule implements OnModuleInit {
  constructor(private readonly commandHandlerService: CommandHandlerService) {}

  /**
   * Can we generate this dynamically from the `@Module` decorator?
   * {
   * // ...
   *  commands: [AddQuestionToSurvey],
   *  commandHandlers: [AddQuestionToSurveyCommandHandler]
   * }
   */
  onModuleInit() {
    this.commandHandlerService
      .register({
        CommandPayloadCtor: CreateSurvey,
        CommandHandlerCtor: CreateSurveyCommandHandler,
      })
      .register({
        CommandPayloadCtor: AddQuestionToSurvey,
        CommandHandlerCtor: AddQuestionToSurveyCommandHandler,
      });
  }
}
