import { randomUUID } from 'node:crypto';
import { SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN } from '../../../../../features/survey/constants';
import type { ISurveyCommandRepository } from '../../../../../features/survey/repositories';
import type {
  CommandResult,
  ICommandHandler,
} from '../../../../../libs/cqrs-es';
import { TrueImpactError } from '../../../../../libs/data-types';
import { Inject } from '../../../../../libs/framework';
import { Survey } from '../../survey.aggregate-root';
import { ImportSurvey } from './import-survey.command';

export class ImportSurveyCommandHandler implements ICommandHandler<ImportSurvey> {
  constructor(
    @Inject(SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN)
    private readonly repository: ISurveyCommandRepository,
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

    questions.forEach(({ options, label: questionLabel }) =>
      options.forEach(({ flags, label: optionLabel }) => {
        const duplicateFlags = new Set<{
          questionLabel: string;
          optionLabel: string;
          flag: string;
        }>();

        const uniqueFlags = new Set<string>();

        flags.forEach((flag) => {
          if (uniqueFlags.has(flag)) {
            duplicateFlags.add({
              flag,
              questionLabel,
              optionLabel,
            });
          } else {
            uniqueFlags.add(flag);
          }
        });

        if (duplicateFlags.size > 0) {
          duplicateFlagErrors.push(
            ...Array.from(duplicateFlags).map(
              ({ flag, questionLabel, optionLabel }) =>
                new TrueImpactError(
                  `Duplicate flag: ${flag} for question [${questionLabel}], option [${optionLabel}]`,
                ),
            ),
          );
        }
      }),
    );

    if (
      questions.some(({ options }) =>
        options.some(({ flags }) => flags.length > 0),
      )
    ) {
      return new TrueImpactError(
        `Importing flags to a survey is not yet supported`,
      );
    }

    if (duplicateFlagErrors.length > 0) {
      return new TrueImpactError(
        `Encountered duplicate flags when importing question survey [${name}]`,
        duplicateFlagErrors,
      );
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

            const surveyWithThisOption = optionAcc.addOptionToQuestion({
              questionLabel: question.label,
              optionLabel: option.label,
              text: option.text,
            });

            if (surveyWithThisOption instanceof TrueImpactError) {
              return surveyWithThisOption;
            }

            const surveyWithAnalysisValuesForThisOption = Object.entries(
              option.valuesByAnalyzerName,
            ).reduce(
              (
                acc: Survey | TrueImpactError,
                [analyzerName, valuesByCategory],
              ) => {
                if (acc instanceof Error) {
                  return acc;
                }

                return acc.addValueForOption({
                  analyzerName,
                  questionLabel: question.label,
                  optionLabel: option.label,
                  valuesByCategory,
                });
              },
              surveyWithThisOption,
            );

            if (
              surveyWithAnalysisValuesForThisOption instanceof TrueImpactError
            ) {
              return surveyWithAnalysisValuesForThisOption;
            }

            if (!option.followUpQuestion) {
              return surveyWithAnalysisValuesForThisOption;
            }

            // TODO what about analysis values for follow up question options?
            // TODO naming - I'm assuming `followup` is an adjective and `follow up` is a verb phrase
            const surveyWithFollowupQuestionForThisOption =
              surveyWithAnalysisValuesForThisOption.addFollowUpQuestion({
                questionLabel: question.label,
                optionLabel: option.label,
                followUpQuestion: option.followUpQuestion,
              });

            if (surveyWithFollowupQuestionForThisOption instanceof Error) {
              return surveyWithFollowupQuestionForThisOption;
            }

            const surveyWithFollowupOptions =
              option.followUpQuestion.options.reduce(
                (acc: Survey | TrueImpactError, followupOption) => {
                  if (acc instanceof Error) {
                    return acc;
                  }

                  const withThisOption = acc.addOptionToQuestion({
                    questionLabel: option.followUpQuestion?.label as string,
                    optionLabel: followupOption.label,
                    text: followupOption.text,
                  });

                  if (withThisOption instanceof TrueImpactError) {
                    return withThisOption;
                  }

                  const withAnalysisValues = Object.entries(
                    followupOption.valuesByAnalyzerName,
                  ).reduce(
                    (
                      acc: Survey | TrueImpactError,
                      [analyzerName, valuesByCategory],
                    ) => {
                      if (acc instanceof Error) {
                        return acc;
                      }

                      return acc.addValueForOption({
                        analyzerName,
                        questionLabel: option.followUpQuestion?.label as string,
                        optionLabel: followupOption.label,
                        valuesByCategory,
                      });
                    },
                    withThisOption,
                  );

                  return withAnalysisValues;
                },
                surveyWithFollowupQuestionForThisOption,
              );

            return surveyWithFollowupOptions;

            // TODO follow up questions
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

    // TODO we need to rename this to finalize
    const finalizedSurvey = surveyWithQuestions.publish();

    if (finalizedSurvey instanceof Error) {
      return finalizedSurvey;
    }

    const result = await this.repository.create(finalizedSurvey);

    // event history?
    return result;
  }
}
