import { Entity, NonEmptyString, TrueImpactError } from '../../../libs';

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

  @NonEmptyString({
    label: 'next question',
    description:
      'label that identifies the question the user should answer next based on answering the present question with this option',
    isArray: false,
    isOptional: false,
  })
  nextQuestion: string;

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getId(): string {
    throw new Error('Method not implemented.');
  }
}
