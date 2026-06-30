import { MultilingualText } from '../../../common/multilingual-text';
import {
  buildTestInstance,
  InvariantValidationError,
} from '../../../libs/data-types';
import { assertTextMatchesAll } from '../../../libs/test-utils';
import { GroupProgramObservation } from './group-program-observation.entity';

describe(`GroupProgramObservation.validateInvariants`, () => {
  describe(`when the instance is valid`, () => {
    describe(`when only an interaction type is specified`, () => {
      it(`should return the instance`, () => {
        const validInstance = buildTestInstance(GroupProgramObservation, {
          interactionType: 'pure joy',
        });

        const result = validInstance.validateInvariants();

        expect(result).toBeInstanceOf(GroupProgramObservation);
      });
    });

    describe(`when only a note is specified`, () => {
      // TODO Add an invalid case when the langauge code is not supported
      it(`should return the instance`, () => {
        const validInstance = buildTestInstance(GroupProgramObservation, {
          note: MultilingualText.withText({
            text: 'hello world',
            languageCode: 'en',
          }),
        });

        const result = validInstance.validateInvariants();

        expect(result).toBeInstanceOf(GroupProgramObservation);
      });
    });

    describe(`when both note and interaction type are specified`, () => {
      it(`should return the instance`, () => {
        const validInstance = buildTestInstance(GroupProgramObservation, {
          interactionType: 'pure joy',
          note: MultilingualText.withText({
            text: 'a note',
            languageCode: 'en',
          }),
        });

        const result = validInstance.validateInvariants();

        expect(result).toBeInstanceOf(GroupProgramObservation);
      });
    });
  });

  describe(`when the instance is invalid`, () => {
    describe(`when neither a note nor an interaction type is provided`, () => {
      it(`should return the expected error`, () => {
        const invalidInstance = buildTestInstance(
          GroupProgramObservation,
          {},
          { shouldValidate: false },
        );

        const result = invalidInstance.validateInvariants();

        expect(result).not.toBeInstanceOf(GroupProgramObservation);

        const message = (result as InvariantValidationError).toString();

        assertTextMatchesAll(
          message,
          'empty',
          'one of',
          'interaction type',
          'note',
        );
      });
    });
  });
});
