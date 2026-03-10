import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import { SurveyAnalyzer } from '../survey-analysis';
import { Survey } from './survey.aggregate-root';

const surveyName = 'Employee Survey';

const analyzerName = '3 Factor Analysis';

const surveyWithTargetAnalyzer = buildTestInstance(Survey, {
  name: surveyName,
  analyzers: {
    [analyzerName]: SurveyAnalyzer.buildEmpty({
      name: analyzerName,
    }).toPersistenceDto(),
  },
});

const newCategory = 'Integrity';

describe(`Survey.addCategoryToAnalyzer`, () => {
  describe(`when the analyzer exists in the given survey`, () => {
    describe(`when the analyzer does not yet have the given category`, () => {
      it(`should add the category`, () => {
        const result = surveyWithTargetAnalyzer.addCategoryForAnalyzer({
          analyzerName,
          category: newCategory,
        });

        expect(result).toBeInstanceOf(Survey);

        const updated = result as Survey;

        const updatedAnalyzer = updated.analyzersByName.get(analyzerName);

        expect(updatedAnalyzer?.hasCategory(newCategory)).toBe(true);

        expect(updatedAnalyzer?.countCategories()).toBe(1);
      });
    });

    describe(`when the analyzer already has the given category`, () => {
      it(`should return the expected error`, () => {
        const analyzerWithTargetCategory =
          surveyWithTargetAnalyzer.addCategoryForAnalyzer({
            analyzerName,
            category: newCategory,
          }) as Survey;

        const result = analyzerWithTargetCategory.addCategoryForAnalyzer({
          analyzerName,
          category: newCategory,
        });

        expect(result).toBeInstanceOf(TrueImpactError);

        assertTextMatchesAll(
          (result as TrueImpactError).toString(),
          surveyName,
          analyzerName,
          newCategory,
          'already has',
        );
      });
    });
  });

  describe(`when the analyzer does not exist in the given survey`, () => {
    const missingAnalyzerName = 'Student Evaluation';

    it(`should return the expected error`, () => {
      const result = surveyWithTargetAnalyzer.addCategoryForAnalyzer({
        analyzerName: missingAnalyzerName,
        category: newCategory,
      });

      expect(result).toBeInstanceOf(TrueImpactError);

      assertTextMatchesAll(
        (result as TrueImpactError).toString(),
        surveyName,
        missingAnalyzerName,
        'cannot add category',
        newCategory,
        'no such analyzer',
      );
    });
  });
});
