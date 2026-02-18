import {
  InMemoryCommandRepositoryProvider,
  InMemoryQueryRepositoryProvider,
} from '../../common/persistence';
import { CommandHandlerService } from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import { AddFollowUpQuestionForSurveyOption } from './commands/add-follow-up-question-for-survey-option.command';
import { AddFollowUpQuestionForSurveyOptionCommandHandler } from './commands/add-follow-up-question-for-survey-option.command-handler';
import { AddOptionToSurveyQuestion } from './commands/add-option-to-survey-question.command';
import { AddOptionToSurveyQuestionCommandHandler } from './commands/add-option-to-survey.command-handler';
import { AddQuestionToSurvey } from './commands/add-question-to-survey.command';
import { AddQuestionToSurveyCommandHandler } from './commands/add-question-to-survey.command-handler';
import { CreateSurvey } from './commands/create-survey.command';
import { CreateSurveyCommandHandler } from './commands/create-survey.command-handler';
import { PublishSurvey } from './commands/publish-survey.command';
import { PublishSurveyCommandHandler } from './commands/publish-survey.command-handler';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from './constants';
import { SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN } from './queries/survey-query-repository.interface';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModel } from './queries/survey.view-model';
import { Survey } from './survey.aggregate-root';
import { SurveyController } from './survey.controller';

// Is this necessary?
const dataClasses = [Survey, CreateSurvey, AddQuestionToSurvey, PublishSurvey];

@Module({
  imports: [],
  providers: [
    CreateSurveyCommandHandler,
    AddQuestionToSurveyCommandHandler,
    AddOptionToSurveyQuestionCommandHandler,
    AddFollowUpQuestionForSurveyOptionCommandHandler,
    PublishSurveyCommandHandler,
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
          })
          .register({
            CommandHandlerCtor: AddOptionToSurveyQuestionCommandHandler,
            CommandPayloadCtor: AddOptionToSurveyQuestion,
          })
          .register({
            CommandPayloadCtor: AddFollowUpQuestionForSurveyOption,
            CommandHandlerCtor:
              AddFollowUpQuestionForSurveyOptionCommandHandler,
          })
          .register({
            CommandPayloadCtor: PublishSurvey,
            CommandHandlerCtor: PublishSurveyCommandHandler,
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
