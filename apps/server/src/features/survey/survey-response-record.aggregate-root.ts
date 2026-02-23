import { NotImplementedException } from '@nestjs/common';
import { AggregateRoot, Entity, TrueImpactError } from 'src/libs';
import {
  CLIENT,
  ClientCompositeIdentifier,
} from '../clients/client.composite-identifier';
import { SURVEY_RESPONSE_AGGREAGTE_TYPE } from './constants';
import { Survey, SurveyPersistenceDto } from './survey.aggregate-root';

export class SurveyResponseCompositeIdentifier {
  readonly type = SURVEY_RESPONSE_AGGREAGTE_TYPE;

  id: string;
}

class SurveyResponsePersistenceDto {
  // TODO Should we put this in the db?
  type = SURVEY_RESPONSE_AGGREAGTE_TYPE;

  id: string;

  survey: SurveyPersistenceDto;

  /**
   * In the future, participants may be an `Employee`, `CommunityEmployee`, etc. We don't want
   * to assume that surveys can only be completed by a client.
   */

  // TODO Should we attach the survey completion records to the participant (in this case, the Client) instead? This makes it easy to inherit permissions.
  participantCompositeIdentifier: ClientCompositeIdentifier;
}

export class SurveyParticipantCompositeIdentifier {
  type = CLIENT; // This may allow other types such as EMPLOYEE in the future
  id: string;
}

/**
 * Command flow
 * TODO move to separate files once you rebase.
 */
export class BeginSurvey {
  surveyId: string;

  participantCompositeIdentifier: SurveyParticipantCompositeIdentifier;
}

export class RespondToSurveyQuestion {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;

  questionLabel: string;

  chosenOptionLabel: string;
}

export class AbandonSurveyCompletion {
  aggregateCompositeIdentifier: SurveyResponseCompositeIdentifier;
}

export class SubmitSurvey {
  aggreagteCompositeIdentifier: SurveyResponseCompositeIdentifier;
}

export class SurveyResponseRecord extends AggregateRoot<SurveyResponsePersistenceDto> {
  type = SURVEY_RESPONSE_AGGREAGTE_TYPE;

  id: string;

  /**
   * Note that when a participant begins a survey, the target survey is copied here
   * as a value object. Surveys are currently immutable and in the future will be fully
   * versioned.
   */
  // TODO surveyId?
  survey: Survey;

  // Surveys may be anonymous in the future
  participant?: SurveyParticipantCompositeIdentifier;

  // questionLabel -> response optionLabel
  responses: Map<string, string> = new Map();

  constructor({
    id,
    survey,
    responses,
  }: {
    id: string;
    survey: Survey;
    responses: Record<string, string>;
  }) {
    super();

    this.id = id;

    this.survey = survey;

    this.id = id;

    this.responses = new Map(Object.entries(responses));
  }

  /**
   * A survey completion record should
   * - carry responses in the correct order
   *
   * A complete record should
   * - have one response for each question in the survey
   */
  validateComplexInvariants(): TrueImpactError[] {
    throw new Error('Method not implemented.');
  }

  // TODO remove this
  setInitialId(_id: string): Entity | TrueImpactError {
    throw new Error('Method not implemented.');
  }

  getName(): string {
    // append completion date?
    return this.survey.getName();
  }

  toPersistenceDto(): SurveyResponsePersistenceDto {
    throw new Error('Method not implemented.');
  }

  // TODO this should be required by the interface
  static fromPersistenceDto(_dto: any): Survey | TrueImpactError {
    throw new NotImplementedException();
  }

  static begin(
    _survey: Survey,
    _participantId: SurveyParticipantCompositeIdentifier,
  ): Survey | TrueImpactError {
    throw new NotImplementedException();
  }
}
