import { SurveyOption } from '../survey-option.entity';

class FollowUpQuestionViewModel {
  label: string;

  prompt: string;

  options: Map<string, SurveyOptionViewModel>;
}

export class SurveyOptionViewModel {
  label: string;

  text: string;

  followUpQuestions: FollowUpQuestionViewModel[];

  constructor({
    label,
    text,
    followUpQuestions,
  }: {
    label: string;
    text: string;
    followUpQuestions?: FollowUpQuestionViewModel[];
  }) {
    this.label = label;

    this.text = text;

    this.followUpQuestions = followUpQuestions || [];
  }

  static fromDomainModel(
    surveyOption: SurveyOption,
    questionsByLabel: Map<string, FollowUpQuestionViewModel>,
  ) {
    const followUpQuestions: FollowUpQuestionViewModel[] = [];

    if (
      typeof surveyOption.followUpQuestionLabel === 'string' &&
      surveyOption.followUpQuestionLabel.length > 0
    ) {
      if (questionsByLabel.has(surveyOption.followUpQuestionLabel)) {
        followUpQuestions.push(
          questionsByLabel.get(
            surveyOption.followUpQuestionLabel,
          ) as FollowUpQuestionViewModel,
        );
      }
    }

    return new SurveyOptionViewModel({
      label: surveyOption.label,
      text: surveyOption.text,
      followUpQuestions,
    });
  }
}
