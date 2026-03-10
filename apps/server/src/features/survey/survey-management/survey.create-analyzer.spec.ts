import { buildTestInstance, TrueImpactError } from '../../../libs/data-types';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import { Survey } from './survey.aggregate-root';

const surveyName = 'What kind of person are you?';

const surveyWithNoAnalyzer = buildTestInstance(Survey, {
  name: surveyName,
  analyzers: {},
});

const newAnalyzerName = 'Personality Test';

describe(`Survey.createAnalyzer`, () => {
  describe(`when the survey does not yet have an analyzer`, () => {
    it(`should add the analyzer`, () => {
      const result = surveyWithNoAnalyzer.createAnalyzer({
        name: newAnalyzerName,
      });

      expect(result).toBeInstanceOf(Survey);

      const updated = result as Survey;

      expect(updated.analyzersByName.size).toBe(1);
    });
  });

  describe(`when the survey already has an analyzer`, () => {
    describe(`when there is already an analyzer with the given name`, () => {
      const duplicateName = 'So nice they named it twice';

      it(`should return the expected error`, () => {
        const surveyWithExistingAnalyzer = surveyWithNoAnalyzer.createAnalyzer({
          name: duplicateName,
        }) as Survey;

        const result = surveyWithExistingAnalyzer.createAnalyzer({
          name: duplicateName,
        });

        expect(result).toBeInstanceOf(TrueImpactError);

        const message = (result as TrueImpactError).toString();

        assertTextMatchesAll(
          message,
          surveyName,
          duplicateName,
          'already has an analyzer',
        );
      });
    });

    describe(`when the survey does not have an analyzer with the given name`, () => {
      const existingName = 'Personality Tester Strategy #1';

      it(`should add the analyzer`, () => {
        const surveyWithFirstAnalyzer = surveyWithNoAnalyzer.createAnalyzer({
          name: existingName,
        }) as Survey;

        const result = surveyWithFirstAnalyzer.createAnalyzer({
          name: newAnalyzerName,
        });

        expect(result).toBeInstanceOf(Survey);

        const updated = result as Survey;

        expect(updated.analyzersByName.size).toBe(2);

        expect(updated.analyzersByName.has(existingName)).toBe(true);

        expect(updated.analyzersByName.has(newAnalyzerName)).toBe(true);
      });
    });
  });
});
