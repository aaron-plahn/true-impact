import { Entity, TrueImpactError } from '../../../libs';

type SurveyLabel = string;

export class SurveyQuestion extends Entity {
  // e.g. 1, 2, 3
  label: string;

  options: Map<SurveyLabel, SurveyQuestion>;

  validateComplexInvariants(): TrueImpactError[] {
    return [];
  }

  getId(): string {
    return this.label;
  }
}
