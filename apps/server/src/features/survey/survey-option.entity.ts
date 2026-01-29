import { Entity, NonEmptyString, TrueImpactError } from '../../libs';
import {
  SurveyQuestion,
  SurveyQuestionPersistenceDto,
} from './survey-question.entity';

export class SurveyOptionPersistenceDto {
  label: string;
  text: string;
  nextQuestion: SurveyQuestionPersistenceDto;
}

export class SurveyOption extends Entity {
  @NonEmptyString({
    label: 'label',
    description: 'the label for this survey option (e.g., b, ii, 2)',
    isArray: false,
    isOptional: false,
  })
  label: string;

  @NonEmptyString({
    label: 'text',
    description: 'text to display to the user for this option',
    isArray: false,
    isOptional: false,
  })
  text: string; // TODO make this translateable

  // @NestedDataType(SurveyQuestion,{
  //   label: 'next question',
  //   description:
  //     'label that identifies the question the user should answer next based on answering the present question with this option',
  //   isArray: false,
  //   isOptional: false,
  // })
  nextQuestion: SurveyQuestion;

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getId(): string {
    return this.label;
  }

  /**
   * Eventually, we will support creating a draft of edits to a live survey. Once the draft
   * is published, the survey revision number (version) will be incremented. This will allow us
   * to keep track of which version of a suvey a client completed over time.
   */
  getRevisionNumber(): number {
    return 1;
  }

  toPersistenceDto(): SurveyOptionPersistenceDto {
    const result: SurveyOptionPersistenceDto = {
      label: this.label,
      text: this.text,
      nextQuestion: this.nextQuestion?.toPersistenceDto(),
    };

    return result;
  }
}
