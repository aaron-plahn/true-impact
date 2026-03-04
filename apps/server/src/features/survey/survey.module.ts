import {
  InMemoryCommandRepository,
  InMemoryQueryRepositoryProvider,
} from '../../common/persistence';
import { CommandHandlerService } from '../../libs/cqrs-es';
import {
  TrueImpactBadUserInputError,
  TrueImpactError,
} from '../../libs/data-types';
import { Module, ModuleRef } from '../../libs/framework';
import { CLIENT_AGGREGATE_TYPE } from '../clients/client.composite-identifier';
import { ClientModule } from '../clients/client.module';
import { ClientValidationService } from '../clients/services';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from './constants';
import { SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN } from './queries/survey-query-repository.interface';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModel } from './queries/survey.view-model';
import {
  AbandonSurveyCompletion,
  AbandonSurveyCompletionCommandHandler,
  AnswerSurveyQuestion,
  AnswerSurveyQuestionCommandHandler,
  BeginSurvey,
  SubmitSurvey,
  SubmitSurveyCommandHandler,
} from './survey-completion';
import {
  BeginSurveyCommandHandler,
  SURVEY_PARTICIPANT_VALIDATION_SERVICE_PROVIDER_INJECTION_TOKEN,
} from './survey-completion/commands/begin-survey.command-handler';
import {
  SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN,
  SurveyResponseQueryService,
} from './survey-completion/queries';
import { SurveyResponseRecordViewModel } from './survey-completion/queries/survey-response-record.view-model';
import { SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN } from './survey-completion/repositories';
import { InMemorySurveyResponseCommandRepository } from './survey-completion/repositories/in-memory-survey-response.command-repository';
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
import { SurveyResponseController } from './survey-response.controller';
import { SurveyController } from './survey.controller';

// Is this necessary?
const dataClasses = [Survey, CreateSurvey, AddQuestionToSurvey, PublishSurvey];

@Module({
  imports: [ClientModule],
  providers: [
    CreateSurveyCommandHandler,
    AddQuestionToSurveyCommandHandler,
    AddOptionToSurveyQuestionCommandHandler,
    AddFollowUpQuestionForSurveyOptionCommandHandler,
    PublishSurveyCommandHandler,
    // Survey Completion Commands
    BeginSurveyCommandHandler,
    AnswerSurveyQuestionCommandHandler,
    AbandonSurveyCompletionCommandHandler,
    SubmitSurveyCommandHandler,
    // services
    SurveyQueryService,
    SurveyResponseQueryService,
    {
      provide: SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN,
      useValue: new InMemoryQueryRepositoryProvider().forFeature(
        SurveyViewModel,
      ),
    },
    {
      provide: SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN,
      useValue: new InMemoryQueryRepositoryProvider().forFeature(
        SurveyResponseRecordViewModel,
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
          })
          .register({
            CommandHandlerCtor: AnswerSurveyQuestionCommandHandler,
            CommandPayloadCtor: AnswerSurveyQuestion,
          })
          .register({
            CommandHandlerCtor: AbandonSurveyCompletionCommandHandler,
            CommandPayloadCtor: AbandonSurveyCompletion,
          })
          .register({
            CommandHandlerCtor: SubmitSurveyCommandHandler,
            CommandPayloadCtor: SubmitSurvey,
          });

        return commandHandlerService;
      },
      inject: [ModuleRef],
    },
    {
      provide: SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN,
      useFactory: () => new InMemoryCommandRepository(Survey),
    },
    {
      provide: SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => {
        return new InMemorySurveyResponseCommandRepository();
      },
    },
    {
      provide: SURVEY_PARTICIPANT_VALIDATION_SERVICE_PROVIDER_INJECTION_TOKEN,
      useFactory: (clientValidationService: ClientValidationService) => {
        return {
          forEntity(entityType: string) {
            if (entityType === CLIENT_AGGREGATE_TYPE) {
              return clientValidationService;
            }

            return new TrueImpactBadUserInputError([
              new TrueImpactError(
                `Failed to validate survey participant of unknown type: ${entityType}`,
              ),
            ]);
          },
        };
      },
      inject: [ClientValidationService],
    },
  ],
  // Exposing data classes allows us to drive them via repl
  exports: [...dataClasses],
  controllers: [SurveyController, SurveyResponseController],
})
export class SurveyModule {}
