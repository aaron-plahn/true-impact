import {
  InMemoryCommandRepositoryProvider,
  InMemoryQueryRepositoryProvider,
} from '../../common/persistence';
import { CommandHandlerService } from '../../libs/cqrs-es';
import { Module, ModuleRef } from '../../libs/framework';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from './constants';
import { SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN } from './queries/survey-query-repository.interface';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModel } from './queries/survey.view-model';
import { BeginSurvey, SurveyResponseRecord } from './survey-completion';
import { SurveyCompletionController } from './survey-completion.controller';
import { BeginSurveyCommandHandler } from './survey-completion/commands/begin-survey.command-handler';
import {
  SURVEY_COMPLETION_QUERY_REPOSITORY_INJECTION_TOKEN,
  SurveyCompletionQueryService,
} from './survey-completion/queries';
import { SurveyCompletionRecordViewModel } from './survey-completion/queries/survey-completion-record.view-model';
import { SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN } from './survey-completion/repositories';
import { AddFollowUpQuestionForSurveyOption } from './survey-management/commands/add-follow-up-question-for-survey-option.command';
import { AddFollowUpQuestionForSurveyOptionCommandHandler } from './survey-management/commands/add-follow-up-question-for-survey-option.command-handler';
import { AddOptionToSurveyQuestion } from './survey-management/commands/add-option-to-survey-question.command';
import { AddOptionToSurveyQuestionCommandHandler } from './survey-management/commands/add-option-to-survey.command-handler';
import { AddQuestionToSurvey } from './survey-management/commands/add-question-to-survey.command';
import { AddQuestionToSurveyCommandHandler } from './survey-management/commands/add-question-to-survey.command-handler';
import { CreateSurvey } from './survey-management/commands/create-survey.command';
import { CreateSurveyCommandHandler } from './survey-management/commands/create-survey.command-handler';
import { PublishSurvey } from './survey-management/commands/publish-survey.command';
import { PublishSurveyCommandHandler } from './survey-management/commands/publish-survey.command-handler';
import { Survey } from './survey-management/survey.aggregate-root';
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
    // Survey Completion Commands
    BeginSurveyCommandHandler,
    SurveyQueryService,
    SurveyCompletionQueryService,
    {
      provide: SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN,
      useValue: new InMemoryQueryRepositoryProvider().forFeature(
        SurveyViewModel,
      ),
    },
    {
      provide: SURVEY_COMPLETION_QUERY_REPOSITORY_INJECTION_TOKEN,
      useValue: new InMemoryQueryRepositoryProvider().forFeature(
        SurveyCompletionRecordViewModel,
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
          })
          // Survey Completion
          .register({
            CommandHandlerCtor: BeginSurveyCommandHandler,
            CommandPayloadCtor: BeginSurvey,
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
    {
      provide: SURVEY_COMPLETION_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useFactory: () =>
        new InMemoryCommandRepositoryProvider().forFeature(
          SurveyResponseRecord,
        ),
    },
  ],
  // Exposing data classes allows us to drive them via repl
  exports: [...dataClasses],
  controllers: [SurveyController, SurveyCompletionController],
})
export class SurveyModule {}
