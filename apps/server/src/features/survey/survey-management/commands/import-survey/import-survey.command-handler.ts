import { randomUUID } from 'node:crypto';
import { FLAG_VALIDATION_SERVICE_INJECTION_TOKEN } from '../../../../../features/flags/constants';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../../../../features/survey/constants';
import type { ISurveyCommandRepository } from '../../../../../features/survey/repositories';
import type {
  CommandResult,
  ICommandHandler,
} from '../../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../../libs/data-types';
import { Inject } from '../../../../../libs/framework';
import { Survey } from '../../survey.aggregate-root';
import {
  ImportSurvey,
  SurveyOptionImportDto,
  SurveyQuestionImportDto,
} from './import-survey.command';

const addFollowUpQuestion = (
  draftSurvey: Survey,
  parentQuestionLabel: string,
  parentOptionLabel: string,
  followUpQuestion: SurveyQuestionImportDto,
  flagIdsByLabel: Map<string, string>,
): Survey | TrueImpactError => {
  const surveyWithQuestion = draftSurvey.addFollowUpQuestion({
    questionLabel: parentQuestionLabel,
    optionLabel: parentOptionLabel,
    followUpQuestion,
  });

  if (surveyWithQuestion instanceof Error) {
    return surveyWithQuestion;
  }

  const withOptions = followUpQuestion.options.reduce(
    (acc, followUpOption) =>
      acc instanceof Error
        ? acc
        : deepAddOptionToQuestion(
            acc,
            followUpQuestion.label,
            followUpOption,
            flagIdsByLabel,
          ),
    surveyWithQuestion,
  );

  return withOptions;
};

const deepAddOptionToQuestion = (
  draftSurvey: Survey,
  parentQuestionLabel: string,
  option: SurveyOptionImportDto,
  flagIdsByLabel: Map<string, string>,
) => {
  const surveyWithOption = draftSurvey.addOptionToQuestion({
    questionLabel: parentQuestionLabel,
    optionLabel: option.label,
    text: option.text,
  });

  if (surveyWithOption instanceof Error) {
    return surveyWithOption;
  }

  const surveyWithFlagsForThisOption = option.flags.reduce(
    (acc, flag): Survey | TrueImpactError => {
      if (acc instanceof Error) {
        return acc;
      }

      const flagId = flagIdsByLabel.get(flag.label);

      if (!flagId) {
        return new TrueImpactError(
          `You cannot add the flag [${flag.label}] for option [${option.label}] of question [${parentQuestionLabel}] in survey: [${acc.name}], as there is no flag with this label`,
        );
      }

      return acc.flagOption({
        questionLabel: parentQuestionLabel,
        optionLabel: option.label,
        flagId,
      });
    },
    surveyWithOption,
  );

  if (surveyWithFlagsForThisOption instanceof Error) {
    return surveyWithFlagsForThisOption;
  }

  const surveyWithAnalysisValuesForThisOption = Object.entries(
    option.valuesByAnalyzerName,
  ).reduce(
    (acc: Survey | TrueImpactError, [analyzerName, valuesByCategory]) => {
      if (acc instanceof Error) {
        return acc;
      }

      return acc.addValueForOption({
        analyzerName,
        questionLabel: parentQuestionLabel,
        optionLabel: option.label,
        valuesByCategory,
      });
    },
    surveyWithFlagsForThisOption,
  );

  if (surveyWithAnalysisValuesForThisOption instanceof TrueImpactError) {
    return surveyWithAnalysisValuesForThisOption;
  }

  if (!option.followUpQuestion) {
    return surveyWithAnalysisValuesForThisOption;
  }

  return addFollowUpQuestion(
    surveyWithAnalysisValuesForThisOption,
    parentQuestionLabel,
    option.label,
    option.followUpQuestion,
    flagIdsByLabel,
  );
};

export interface IFlagServiceForSurveyImports {
  upsertMany(
    labels: { label: string; description?: string }[],
  ): Promise<(TrueImpactError | { id: string; label: string })[]>;
}

export class ImportSurveyCommandHandler implements ICommandHandler<ImportSurvey> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly repository: ISurveyCommandRepository,
    @Inject(FLAG_VALIDATION_SERVICE_INJECTION_TOKEN)
    private readonly flagService: IFlagServiceForSurveyImports,
  ) {}

  async handle({
    payload: {
      name: { text: name },
      questions,
      analyzers,
    },
  }: {
    payload: ImportSurvey;
  }): Promise<CommandResult> {
    const duplicateFlagErrors: TrueImpactError[] = [];

    const uniqueFlagsAcrossAllQuestions = new Set<string>();

    const registerFlagsForOption = (
      { flags, label: optionLabel, followUpQuestion }: SurveyOptionImportDto,
      questionLabel: string,
    ): void => {
      const duplicateFlagsForThisOption = new Set<{
        questionLabel: string;
        optionLabel: string;
        flag: string;
      }>();

      const uniqueFlagsForThisOption = new Set<string>();

      flags.forEach((flag) => {
        if (uniqueFlagsForThisOption.has(flag.label)) {
          duplicateFlagsForThisOption.add({
            flag: flag.label,
            questionLabel,
            optionLabel,
          });
        } else {
          uniqueFlagsForThisOption.add(flag.label);
        }
      });

      if (followUpQuestion) {
        followUpQuestion.options.forEach((followUpOption) =>
          registerFlagsForOption(followUpOption, followUpQuestion.label),
        );
      }

      if (duplicateFlagsForThisOption.size > 0) {
        duplicateFlagErrors.push(
          ...Array.from(duplicateFlagsForThisOption).map(
            ({ flag, questionLabel, optionLabel }) =>
              new TrueImpactError(
                `Duplicate flag: ${flag} for question [${questionLabel}], option [${optionLabel}]`,
              ),
          ),
        );
      } else {
        uniqueFlagsForThisOption.forEach((f) =>
          uniqueFlagsAcrossAllQuestions.add(f),
        );
      }
    };

    questions.forEach(({ options, label: questionLabel }) =>
      options.forEach((option) => {
        registerFlagsForOption(option, questionLabel);
      }),
    );

    const flagIdsByLabel = new Map<string, string>();

    if (duplicateFlagErrors.length > 0) {
      return new TrueImpactError(
        `Encountered duplicate flags when importing question survey [${name}]`,
        duplicateFlagErrors,
      );
    } else if (uniqueFlagsAcrossAllQuestions.size > 0) {
      const flagUpsertResults = await this.flagService.upsertMany(
        Array.from(uniqueFlagsAcrossAllQuestions).map((label) => ({
          label,
          // TODO we need to support the user specifying descriptions for new flags
        })),
      );

      const flagUpsertErrors = flagUpsertResults.flatMap((result) =>
        result instanceof Error ? [result] : [],
      );

      if (flagUpsertErrors.length > 0) {
        return new TrueImpactError(
          `Failed to import survey [${name}]. Flag management failed.`,
          flagUpsertErrors,
        );
      }

      flagUpsertResults.forEach((result) => {
        const flag = result as { id: string; label: string };

        flagIdsByLabel.set(flag.label, flag.id);
      });
    }

    const newSurvey = Survey.buildEmpty({ name, id: randomUUID() });

    if (newSurvey instanceof TrueImpactError) {
      return newSurvey;
    }

    const surveyWithAnalyzers = analyzers.reduce(
      (acc: Survey | TrueImpactError, analyzer) => {
        if (acc instanceof Error) {
          return acc;
        }

        // TODO we should make this ML text on the model, too
        const withAnalyzer = acc.createAnalyzer({ name: analyzer.name.text });

        if (withAnalyzer instanceof Error) {
          return withAnalyzer;
        }

        const withCategories = analyzer.categories.reduce(
          (acc: Survey | TrueImpactError, category) => {
            if (acc instanceof Error) {
              return acc;
            }

            return acc.addCategoryForAnalyzer({
              analyzerName: analyzer.name.text,
              category,
            });
          },
          withAnalyzer,
        );

        return withCategories;
      },
      newSurvey,
    );

    if (surveyWithAnalyzers instanceof Error) {
      return surveyWithAnalyzers;
    }

    /**
     * TODO can we make our update methods chainable (use monad)?
     */
    const surveyWithQuestions = questions.reduce(
      (acc: Survey | TrueImpactError, question) => {
        if (acc instanceof TrueImpactError) {
          return acc;
        }

        const surveyWithThisQuestion = acc.addTopLevelQuestion({
          label: question.label,
          prompt: question.prompt,
        });

        if (surveyWithThisQuestion instanceof Error) {
          return surveyWithThisQuestion;
        }

        const surveyWithAllOptions = question.options.reduce(
          (optionAcc: Survey | TrueImpactError, option) => {
            if (optionAcc instanceof Error) {
              return optionAcc;
            }

            const result = deepAddOptionToQuestion(
              optionAcc,
              question.label,
              option,
              flagIdsByLabel,
            );

            return result;
          },
          surveyWithThisQuestion,
        );

        return surveyWithAllOptions;
      },
      surveyWithAnalyzers,
    );

    if (surveyWithQuestions instanceof Error) {
      return surveyWithQuestions;
    }

    const finalizedSurvey = surveyWithQuestions.finalize();

    if (finalizedSurvey instanceof Error) {
      return finalizedSurvey;
    }

    const result = await this.repository.create(finalizedSurvey);

    // event history?
    return result;
  }
}
