import { FlagViewModelClientDto } from '../../../features/flags/queries';
import {
  deepConvertMapToObject,
  NonEmptyString,
} from '../../../libs/data-types';
import { SurveyOption } from '../survey-management/survey-option.entity';
import { SurveyFlagViewModelClientDto } from './survey-flag.view-model';

export class FollowUpQuestionViewModelClientDto {
  @NonEmptyString({
    label: 'label',
    description: 'unique label for this follow-up question',
  })
  label: string;

  @NonEmptyString({
    label: 'question',
    description: 'the text for the current question in the survey',
  })
  prompt: string;

  // TODO
  // @NestedDataType(())
  options: Record<string, SurveyOptionViewModelClientDto>;
}

export class FollowUpQuestionViewModel {
  label: string;

  prompt: string;

  options: Map<string, SurveyOptionViewModel>;

  constructor({
    label,
    prompt,
    options,
  }: {
    label: string;
    prompt: string;
    options: Map<string, SurveyOptionViewModel>;
  }) {
    this.label = label;

    this.prompt = prompt;

    this.options = options;
  }

  toClientDto(): FollowUpQuestionViewModelClientDto {
    const options: Record<string, SurveyOptionViewModelClientDto> = {};

    this.options.forEach((o) => {
      options[o.label] = o.toClientDto();
    });

    return {
      label: this.label,
      prompt: this.prompt,
      options: {},
    };
  }
}

export class SurveyOptionViewModelClientDto {
  label: string;

  text: string;

  followUpQuestions: FollowUpQuestionViewModelClientDto[];

  flags: Record<string, SurveyFlagViewModelClientDto>;

  valuesByAnalyzerName: Record<string, Record<string, number>>;
}

export class SurveyOptionViewModel {
  label: string;

  text: string;

  followUpQuestions: FollowUpQuestionViewModel[];

  flags: Map<string, SurveyFlagViewModelClientDto>;

  valuesByAnalyzerName: Map<string, Map<string, number>>;

  constructor({
    label,
    text,
    followUpQuestions,
    flags,
    valuesByAnalyzerName,
  }: {
    label: string;
    text: string;
    flags: Map<string, SurveyFlagViewModelClientDto>;
    followUpQuestions?: FollowUpQuestionViewModel[];
    valuesByAnalyzerName: Map<string, Map<string, number>>;
  }) {
    this.label = label;

    this.text = text;

    if (followUpQuestions) {
      this.followUpQuestions = followUpQuestions;
    } else {
      this.followUpQuestions = [];
    }

    this.flags = flags;

    this.valuesByAnalyzerName = valuesByAnalyzerName;
  }

  toClientDto(): SurveyOptionViewModelClientDto {
    const followUpQuestions = this.followUpQuestions.map((fuq) =>
      fuq.toClientDto(),
    );

    const valuesByAnalyzerName = deepConvertMapToObject(
      this.valuesByAnalyzerName,
    );

    return {
      label: this.label,
      text: this.text,
      followUpQuestions,
      flags: deepConvertMapToObject(this.flags),
      valuesByAnalyzerName,
    };
  }

  static fromDomainModel(
    surveyOption: SurveyOption,
    questionsByLabel: Map<string, FollowUpQuestionViewModel>,
    context: {
      flags: Map<string, FlagViewModelClientDto>;
      analyzerValuesByOptionLabel: Map<
        string,
        Map<string, Map<string, number>>
      >;
    },
  ) {
    const followUpQuestions: FollowUpQuestionViewModel[] = [];

    if (
      typeof surveyOption.followUpQuestionLabel === 'string' &&
      surveyOption.followUpQuestionLabel.length > 0
    ) {
      if (questionsByLabel.has(surveyOption.followUpQuestionLabel)) {
        const targetFollowUpQuestion = questionsByLabel.get(
          surveyOption.followUpQuestionLabel,
        ) as FollowUpQuestionViewModel;

        followUpQuestions.push(targetFollowUpQuestion);
      }
    }

    const flags = new Map<string, SurveyFlagViewModelClientDto>();

    surveyOption.flagIds.forEach((flagId) => {
      if (!context.flags.has(flagId)) {
        return;
      }

      const flag = context.flags.get(flagId) as FlagViewModelClientDto;

      flags.set(flagId, {
        id: flag.id,
        label: flag.label,
        description: flag.description,
      });
    });

    const valuesByAnalyzerName =
      context.analyzerValuesByOptionLabel.get(surveyOption.label) ||
      new Map<string, Map<string, number>>();

    return new SurveyOptionViewModel({
      label: surveyOption.label,
      text: surveyOption.text,
      followUpQuestions,
      flags,
      valuesByAnalyzerName,
    });
  }
}
