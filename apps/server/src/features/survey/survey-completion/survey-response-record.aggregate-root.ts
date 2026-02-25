import {
  AggregateRoot,
  buildTestInstance,
  Entity,
  InvariantValidationError,
  TrueImpactBadUserInputError,
  TrueImpactDataExample,
  TrueImpactError,
  UpdateMethod,
} from '../../../libs/data-types';
import { CLIENT_AGGREGATE_TYPE } from '../../clients/client.composite-identifier';
import { DONE, SURVEY_RESPONSE_AGGREAGTE_TYPE } from '../constants';
import { SurveyQuestion } from '../survey-management/survey-question.entity';
import {
  Survey,
  SurveyPersistenceDto,
} from '../survey-management/survey.aggregate-root';
import { SurveyParticipantCompositeIdentifier } from './survey-participant.composite-identifier';

export class SurveyResponseCompositeIdentifier {
  readonly type = SURVEY_RESPONSE_AGGREAGTE_TYPE;

  id: string;
}

class SurveyQuestionResponse extends Entity {
  questionLabel: string;
  optionLabel: string;

  constructor({
    questionLabel,
    optionLabel,
  }: {
    questionLabel: string;
    optionLabel: string;
  }) {
    super();

    this.questionLabel = questionLabel;

    this.optionLabel = optionLabel;
  }

  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    return allErrors;
  }

  getId(): string {
    return `${this.questionLabel}:${this.optionLabel}`;
  }

  getName(): string {
    return this.getId();
  }

  toPersistenceDto(): unknown {
    throw new Error('Method not implemented.');
  }

  static fromPersistenceDto({
    questionLabel,
    optionLabel,
  }: {
    questionLabel: string;
    optionLabel: string;
  }): SurveyQuestionResponse | TrueImpactError {
    return new SurveyQuestionResponse({
      questionLabel,
      optionLabel,
    });
  }
}

export class SurveyResponseRecordPersistenceDto {
  id: string;

  revision: number;

  survey: SurveyPersistenceDto;

  hasBeenAbandoned: boolean;

  hasBeenSubmitted: boolean;

  /**
   * In the future, participants may be an `Employee`, `CommunityEmployee`, etc. We don't want
   * to assume that surveys can only be completed by a client.
   */

  // TODO Should we attach the survey completion records to the participant (in this case, the Client) instead? This makes it easy to inherit permissions.
  participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier;

  responses: SurveyQuestionResponse[];
}

const testSurveyExample = buildTestInstance(Survey).toPersistenceDto();

@TrueImpactDataExample<SurveyResponseRecordPersistenceDto>({
  example: {
    id: '123',
    revision: 5,
    survey: testSurveyExample,
    hasBeenAbandoned: false,
    hasBeenSubmitted: false,
    participantCompositeIdentifier: {
      type: CLIENT_AGGREGATE_TYPE,
      id: '55',
    },
    // empty by default
    responses: [],
  },
})
export class SurveyResponseRecord extends AggregateRoot<SurveyResponseRecordPersistenceDto> {
  static readonly type = SURVEY_RESPONSE_AGGREAGTE_TYPE;

  // This is required in the persistence DTO, but optional here because it is generated upon creation in the database
  id?: string;

  revision: number;

  /**
   * Note that when a participant begins a survey, the target survey is copied here
   * as a value object. Surveys are currently immutable and in the future will be fully
   * versioned.
   */
  survey: Survey;

  // Surveys may be anonymous in the future
  participant?: SurveyParticipantCompositeIdentifier;

  /**
   * We store these in an array to also track the order
   * in which questions have been answered for easier validation.
   */
  responses: SurveyQuestionResponse[];

  hasBeenAbandoned: boolean;

  nextQuestionLabel: string | DONE;

  hasBeenSubmitted = false;

  constructor({
    id,
    revision,
    hasBeenAbandoned,
    survey,
    responses,
    hasBeenSubmitted,
    participant,
  }: {
    id?: string;
    revision: number;
    hasBeenAbandoned: boolean;
    survey: Survey;
    // surveys may be anonymous
    participant?: SurveyParticipantCompositeIdentifier;
    // FROM DTO?
    responses: SurveyQuestionResponse[];
    hasBeenSubmitted?: boolean;
  }) {
    super();

    if (typeof id === 'string') {
      this.id = id;
    }

    this.survey = survey;

    this.revision = revision;

    this.responses = responses;

    this.hasBeenAbandoned =
      typeof hasBeenAbandoned === 'boolean' ? hasBeenAbandoned : false;

    this.hasBeenSubmitted =
      typeof hasBeenSubmitted === 'boolean' ? hasBeenSubmitted : false;

    if (participant) {
      this.participant = {
        type: participant.type,
        id: participant.id,
      };
    }

    if (responses.length < survey.size()) {
      if (responses.length > 0) {
        const { questionLabel, optionLabel } = responses[responses.length - 1];

        this.nextQuestionLabel = survey.getNextQuestionLabel(
          questionLabel,
          optionLabel,
        ) as string;
      } else {
        // We have no responses, so the next question is the first one in the survey
        this.nextQuestionLabel = survey.topLevelQuestionLabels[0];
      }
    } else {
      this.nextQuestionLabel = DONE;
    }
  }

  @UpdateMethod()
  answerQuestion(
    questionLabel: string,
    chosenOptionLabel: string,
  ): SurveyResponseRecord | TrueImpactError {
    if (!this.survey.questionBank.has(questionLabel)) {
      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] in survey [${this.survey.name}], as there is no such question.`,
      );
    }

    const targetQuestion = this.survey.get(questionLabel) as SurveyQuestion;

    if (!targetQuestion.has(chosenOptionLabel)) {
      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] with the response option [${chosenOptionLabel}] in survey [${this.survey.name}], as there is no such option`,
      );
    }

    if (this.hasResponseFor(questionLabel)) {
      const optionLabelForExistingQuestionAnswer = this.responses.find(
        (r) => r.questionLabel === questionLabel,
      )?.optionLabel as string;

      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] in survey [${this.survey.name}] with option [${chosenOptionLabel}], as it already has been answered with option [${optionLabelForExistingQuestionAnswer}]`,
      );
    }

    if (questionLabel !== this.nextQuestionLabel) {
      return new TrueImpactError(
        `You cannot answer question [${questionLabel}] in survey [${this.survey.name}], as it is not the next question ([${this.nextQuestionLabel as string}])`,
      );
    }

    this.responses.push(
      // can't this just be a value object?
      SurveyQuestionResponse.fromPersistenceDto({
        questionLabel,
        optionLabel: chosenOptionLabel,
      }) as SurveyQuestionResponse,
    );

    if (!this.isComplete()) {
      // should we allow this.nextQuestionLabel to be `DONE`
      this.nextQuestionLabel = this.survey.getNextQuestionLabel(
        questionLabel,
        chosenOptionLabel,
      ) as string;
    } else {
      this.nextQuestionLabel = DONE;
    }

    return this;
  }

  @UpdateMethod()
  submit(): SurveyResponseRecord | TrueImpactError {
    if (this.hasBeenAbandoned) {
      return new TrueImpactError(
        `You cannot submit survey [${this.survey.name}], as it has been abandoned`,
      );
    }

    if (!this.isComplete()) {
      return new TrueImpactError(
        `You cannot submit survey [${this.survey.name}], as it has not been fully completed`,
      );
    }

    if (this.hasBeenSubmitted) {
      return new TrueImpactError(
        `You cannot submit survey [${this.survey.name}], as it has already been submitted`,
      );
    }

    this.hasBeenSubmitted = true;

    return this;
  }

  @UpdateMethod()
  abandon(): SurveyResponseRecord | TrueImpactError {
    if (this.hasBeenAbandoned) {
      return new TrueImpactError(
        `You cannot abandon survey [${this.survey.name}], as it has already been abandoned`,
      );
    }

    if (this.hasBeenSubmitted) {
      return new TrueImpactError(
        `You cannot abandon survey [${this.survey.name}], as it has already been submitted`,
      );
    }

    this.hasBeenAbandoned = true;

    return this;
  }

  hasResponseFor(questionLabel: string) {
    return this.responses.some((r) => r.questionLabel === questionLabel);
  }

  /**
   * A survey completion record should
   * - carry responses in the correct order
   *
   * A complete record should
   * - have one response for each question in the survey
   */
  validateComplexInvariants(): TrueImpactError[] {
    const allErrors: TrueImpactError[] = [];

    if (this.survey.size() === 0) {
      allErrors.push(
        new TrueImpactError(
          `You cannot respond to survey [${this.survey.name}] as it has no questions.`,
        ),
      );
    }

    if (!this.survey.isPublished) {
      allErrors.push(
        new TrueImpactError(
          `You cannot respond to survey [${this.survey.name}] as it has not been published`,
        ),
      );
    }

    if (this.hasBeenAbandoned && this.hasBeenSubmitted) {
      allErrors.push(
        new TrueImpactError(
          `Survey [${this.survey.name}] cannot be marked as submitted and abandoned`,
        ),
      );
    }

    return allErrors;
  }

  getName(): string {
    return this.survey.getName();
  }

  progress(): { completed: number; count: number } {
    const completed = this.responses.length;

    return {
      completed,
      count: this.survey.size(),
    };
  }

  /**
   * TODO This logic is not quite right. There are optional
   * questions. We need to do a graph traversal based on
   * the responses to determine if all required questions
   * have been completed.
   */
  isComplete(): boolean {
    const { completed, count } = this.progress();

    return completed === count;
  }

  getNextQuestionLabel(): string | DONE {
    if (this.isComplete()) {
      return DONE;
    }

    return this.nextQuestionLabel;
  }

  toPersistenceDto(): SurveyResponseRecordPersistenceDto {
    return {
      // @ts-expect-error We want this to be required, except on the first persistence. Is there a way to achieve this?
      id: this.id,
      revision: this.revision,
      survey: this.survey.toPersistenceDto(),
      hasBeenAbandoned: this.hasBeenAbandoned,
      hasBeenSubmitted: this.hasBeenSubmitted,
      participantCompositeIdentifier: this.participant,
      responses: this.responses,
    };
  }

  static fromPersistenceDto({
    id,
    revision,
    hasBeenAbandoned,
    hasBeenSubmitted,
    survey,
    responses,
  }: SurveyResponseRecordPersistenceDto):
    | SurveyResponseRecord
    | TrueImpactError {
    const surveyBuildResult = Survey.fromPersistenceDto(survey);

    if (surveyBuildResult instanceof TrueImpactError) {
      return surveyBuildResult;
    }

    const questionResponses = responses.map((r) =>
      SurveyQuestionResponse.fromPersistenceDto(r),
    );

    const questionResponseErrors = questionResponses.filter(
      (qr): qr is TrueImpactError => qr instanceof TrueImpactError,
    );

    if (questionResponseErrors.length > 0) {
      return new InvariantValidationError(
        SurveyResponseRecord,
        questionResponseErrors,
      );
    }

    return new SurveyResponseRecord({
      id,
      revision: revision,
      hasBeenAbandoned,
      hasBeenSubmitted,
      survey: surveyBuildResult,
      responses: questionResponses as SurveyQuestionResponse[],
    });
  }

  static begin(
    survey: Survey,
    participantCompositeIdentifier?: SurveyParticipantCompositeIdentifier,
  ): SurveyResponseRecord | TrueImpactError {
    const allowedParticipantTypes = [CLIENT_AGGREGATE_TYPE];

    if (
      participantCompositeIdentifier &&
      !allowedParticipantTypes.includes(participantCompositeIdentifier.type)
    ) {
      return new TrueImpactError(
        `You cannot begin survey [${survey.name}], as you have provided an invalid participant type [${participantCompositeIdentifier.type}]`,
      );
    }

    if (!survey.isPublished) {
      return new TrueImpactBadUserInputError([
        new TrueImpactError(
          `You cannot begin survey [${survey.name}], as it has not been published`,
        ),
      ]);
    }

    return new SurveyResponseRecord({
      survey,
      responses: [],
      revision: 0,
      hasBeenAbandoned: false,
      hasBeenSubmitted: false,
      participant: participantCompositeIdentifier,
    });
  }
}
