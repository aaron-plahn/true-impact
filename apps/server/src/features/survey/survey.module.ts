import {
  InMemoryCommandRepositoryProvider,
  InMemoryQueryRepositoryProvider,
} from 'src/common/persistence';
import { CommandHandlerService } from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import { AddQuestionToSurvey } from './commands/add-question-to-survey.command';
import { AddQuestionToSurveyCommandHandler } from './commands/add-question-to-survey.command-handler';
import { CreateSurvey } from './commands/create-survey.command';
import { CreateSurveyCommandHandler } from './commands/create-survey.command-handler';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from './constants';
import { SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN } from './queries/survey-query-repository.interface';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModel } from './queries/survey.view-model';
import { Survey } from './survey.aggregate-root';
import { SurveyController } from './survey.controller';

// Is this necessary?
const dataClasses = [Survey, CreateSurvey, AddQuestionToSurvey];

@Module({
  imports: [],
  providers: [
    CreateSurveyCommandHandler,
    AddQuestionToSurveyCommandHandler,
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
    {
      provide: CommandHandlerService,
      // TODO We need to ensure we can acces the child module's providers in this context
      useFactory: (moduleRef: ModuleRef) => {
        const commandHandlerService = new CommandHandlerService({
          resolve(injectionToken) {
            return moduleRef.get(injectionToken);
          },
        });

        commandHandlerService
          .register({
            CommandPayloadCtor: CreateSurvey,
            CommandHandlerCtor: CreateSurveyCommandHandler,
          })
          .register({
            CommandPayloadCtor: AddQuestionToSurvey,
            CommandHandlerCtor: AddQuestionToSurveyCommandHandler,
          });

        return commandHandlerService;
      },
      inject: [ModuleRef],
    },
    {
      provide: SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN,
      useFactory: () =>
        new InMemoryCommandRepositoryProvider().forFeature(Survey),
    },
  ],
  // Exposing data classes allows us to drive them via repl
  exports: [...dataClasses],
  controllers: [SurveyController],
})
export class SurveyModule {}
