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
import { FlagModule } from '../flags/flag.module';
import { AddFollowUpQuestionForSurveyOption } from '../survey/survey-management';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from './constants';
import { SURVEY_QUERY_REPOSITORY_PROVIDER_TOKEN } from './queries/survey-query-repository.interface';
import { SurveyQueryService } from './queries/survey-query.service';
import { SurveyViewModel } from './queries/survey.view-model';
import {
  AddCategoryToSurveyAnalyzer,
  AddCategoryToSurveyAnalyzerCommandHandler,
  AddValueForSurveyOption,
  AddValueForSurveyOptionCommandHandler,
  CreateAnalyzerForSurvey,
  CreateAnalyzerForSurveyCommandHandler,
} from './survey-analysis';
import {
  AbandonSurveyCompletion,
  AbandonSurveyCompletionCommandHandler,
  AnswerSurveyQuestion,
  AnswerSurveyQuestionCommandHandler,
  BeginSurvey,
  BeginSurveyCommandHandler,
  SubmitSurvey,
  SubmitSurveyCommandHandler,
  SURVEY_PARTICIPANT_VALIDATION_SERVICE_PROVIDER_INJECTION_TOKEN,
} from './survey-completion';
import {
  SURVEY_RESPONSE_QUERY_REPOSITORY_INJECTION_TOKEN,
  SurveyResponseQueryService,
} from './survey-completion/queries';
import { SurveyResponseRecordViewModel } from './survey-completion/queries/survey-response-record.view-model';
import { SURVEY_RESPONSE_COMMAND_REPOSITORY_INJECTION_TOKEN } from './survey-completion/repositories';
import { InMemorySurveyResponseCommandRepository } from './survey-completion/repositories/in-memory-survey-response.command-repository';
import { SurveyEventsGateway } from './survey-events.gateway';
import {
  AddFollowUpQuestionForSurveyOptionCommandHandler,
  AddOptionToSurveyQuestion,
  AddOptionToSurveyQuestionCommandHandler,
  AddQuestionToSurvey,
  AddQuestionToSurveyCommandHandler,
  CreateSurvey,
  CreateSurveyCommandHandler,
  FlagSurveyOption,
  FlagSurveyOptionCommandHandler,
  PublishSurvey,
  PublishSurveyCommandHandler,
  Survey,
} from './survey-management';
import { SurveyResponseController } from './survey-response.controller';
import {
  AcknowledgeResponseForSurveyQuestionHasBeenViewed,
  AcknowledgeResponseForSurveyQuestionHasBeenViewedCommandHandler,
  AddGeneralNoteAboutSurveyResponse,
  AddGeneralNoteAboutSurveyResponseCommandHandler,
  AddNoteAboutQuestionResponse,
  AddNoteAboutQuestionResponseCommandHandler,
  BeginReviewOfSurvey,
  BeginReviewOfSurveyCommandHandler,
  FlagSurveyQuestionResponse,
  FlagSurveyQuestionResponseCommandHandler,
  SubmitCompleteSurveyReview,
  SubmitCompleteSurveyReviewCommandHandler,
  SubmitPartialSurveyReview,
  SubmitPartialSurveyReviewCommandHandler,
  SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN,
  SURVEY_REVIEW_QUERY_REPOSITORY_INJECTION_TOKEN,
  SurveyReview,
  SurveyReviewQueryService,
} from './survey-review';
import { SurveyReviewController } from './survey-review.controller';
import { SurveyController } from './survey.controller';

// Is this necessary?
const dataClasses = [Survey, CreateSurvey, AddQuestionToSurvey, PublishSurvey];

@Module({
  imports: [ClientModule, FlagModule],
  providers: [
    SurveyEventsGateway,
    // core survey commands
    CreateSurveyCommandHandler,
    AddQuestionToSurveyCommandHandler,
    AddOptionToSurveyQuestionCommandHandler,
    AddFollowUpQuestionForSurveyOptionCommandHandler,
    PublishSurveyCommandHandler,
    FlagSurveyOptionCommandHandler,
    // Survey Completion Commands
    BeginSurveyCommandHandler,
    AnswerSurveyQuestionCommandHandler,
    AbandonSurveyCompletionCommandHandler,
    SubmitSurveyCommandHandler,
    // Survey Analysis Commands
    CreateAnalyzerForSurveyCommandHandler,
    AddCategoryToSurveyAnalyzerCommandHandler,
    AddValueForSurveyOptionCommandHandler,
    // Survey Review Commands
    BeginReviewOfSurveyCommandHandler,
    AcknowledgeResponseForSurveyQuestionHasBeenViewedCommandHandler,
    AddNoteAboutQuestionResponseCommandHandler,
    AddGeneralNoteAboutSurveyResponseCommandHandler,
    FlagSurveyQuestionResponseCommandHandler,
    SubmitPartialSurveyReviewCommandHandler,
    SubmitCompleteSurveyReviewCommandHandler,
    // services
    SurveyQueryService,
    SurveyResponseQueryService,
    SurveyReviewQueryService,

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
        const commandHandlerService = new CommandHandlerService(
          {
            resolve(injectionToken) {
              return moduleRef.get(injectionToken);
            },
          },
          moduleRef.get(SurveyEventsGateway),
        );

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
          .register({
            CommandHandlerCtor: FlagSurveyOptionCommandHandler,
            CommandPayloadCtor: FlagSurveyOption,
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
          })
          // Survey Analysis
          .register({
            CommandHandlerCtor: CreateAnalyzerForSurveyCommandHandler,
            CommandPayloadCtor: CreateAnalyzerForSurvey,
          })
          .register({
            CommandHandlerCtor: AddCategoryToSurveyAnalyzerCommandHandler,
            CommandPayloadCtor: AddCategoryToSurveyAnalyzer,
          })
          .register({
            CommandHandlerCtor: AddValueForSurveyOptionCommandHandler,
            CommandPayloadCtor: AddValueForSurveyOption,
          })
          // Survey Review
          .register({
            CommandHandlerCtor: BeginReviewOfSurveyCommandHandler,
            CommandPayloadCtor: BeginReviewOfSurvey,
          })
          .register({
            CommandHandlerCtor:
              AcknowledgeResponseForSurveyQuestionHasBeenViewedCommandHandler,
            CommandPayloadCtor:
              AcknowledgeResponseForSurveyQuestionHasBeenViewed,
          })
          .register({
            CommandHandlerCtor: AddNoteAboutQuestionResponseCommandHandler,
            CommandPayloadCtor: AddNoteAboutQuestionResponse,
          })
          .register({
            CommandHandlerCtor: AddGeneralNoteAboutSurveyResponseCommandHandler,
            CommandPayloadCtor: AddGeneralNoteAboutSurveyResponse,
          })
          .register({
            CommandHandlerCtor: FlagSurveyQuestionResponseCommandHandler,
            CommandPayloadCtor: FlagSurveyQuestionResponse,
          })
          .register({
            CommandHandlerCtor: SubmitPartialSurveyReviewCommandHandler,
            CommandPayloadCtor: SubmitPartialSurveyReview,
          })
          .register({
            CommandHandlerCtor: SubmitCompleteSurveyReviewCommandHandler,
            CommandPayloadCtor: SubmitCompleteSurveyReview,
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
      provide: SURVEY_REVIEW_COMMAND_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => {
        return new InMemoryCommandRepository(SurveyReview);
      },
    },
    {
      provide: SURVEY_REVIEW_QUERY_REPOSITORY_INJECTION_TOKEN,
      useFactory: () => {
        return new InMemoryQueryRepositoryProvider();
      },
    },
    /**
     * Note that an alternative pattern is to use a `plug-in` approach
     * by which the client and other modules providing survey participants
     * imports the survey module and registers itself.
     */
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
  controllers: [
    SurveyResponseController,
    SurveyReviewController,
    // this must come last so that `survey/responses` is not routed to its `surveys/:id` with `{ id:responses }`, for example
    SurveyController,
  ],
})
export class SurveyModule {}
