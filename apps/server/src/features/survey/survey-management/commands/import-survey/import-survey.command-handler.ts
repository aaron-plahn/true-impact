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
import { ImportSurvey, SurveyOptionImportDto } from './import-survey.command';

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
        if (uniqueFlagsForThisOption.has(flag)) {
          duplicateFlagsForThisOption.add({
            flag,
            questionLabel,
            optionLabel,
          });
        } else {
          uniqueFlagsForThisOption.add(flag);
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

            const surveyWithThisOption = optionAcc.addOptionToQuestion({
              questionLabel: question.label,
              optionLabel: option.label,
              text: option.text,
            });

            if (surveyWithThisOption instanceof TrueImpactError) {
              return surveyWithThisOption;
            }

            const surveyWithFlagsForThisOption = option.flags.reduce(
              (acc, flag): Survey | TrueImpactError => {
                if (acc instanceof Error) {
                  return acc;
                }

                const flagId = flagIdsByLabel.get(flag);

                if (!flagId) {
                  return new TrueImpactError(
                    `You cannot add the flag [${flag}] for option [${option.label}] of question [${question.label}] in survey: [${acc.name}], as there is no flag with this label`,
                  );
                }

                return acc.flagOption({
                  questionLabel: question.label,
                  optionLabel: option.label,
                  flagId,
                });
              },
              surveyWithThisOption,
            );

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
              surveyWithFlagsForThisOption,
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

                  if (withAnalysisValues instanceof TrueImpactError) {
                    return withAnalysisValues;
                  }

                  // TODO do this for top-level options as well
                  const withFlags = followupOption.flags.reduce(
                    (acc: Survey, flagLabel: string) => {
                      if (acc instanceof Error) {
                        return acc;
                      }

                      const flagId = flagIdsByLabel.get(flagLabel);

                      if (!flagId) {
                        return new TrueImpactError(
                          `You cannot add flag [${flagLabel}] to option [${followupOption.label}] of question [${option.followUpQuestion?.label}] of survey ${acc.name}, as there is no existing flag with this label.`,
                        );
                      }

                      return acc.flagOption({
                        questionLabel: option.followUpQuestion?.label as string,
                        optionLabel: followupOption.label,
                        flagId,
                      });
                    },
                    withThisOption,
                  );

                  return withFlags;
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

    const finalizedSurvey = surveyWithQuestions.finalize();

    if (finalizedSurvey instanceof Error) {
      return finalizedSurvey;
    }

    const result = await this.repository.create(finalizedSurvey);

    // event history?
    return result;
  }
}
