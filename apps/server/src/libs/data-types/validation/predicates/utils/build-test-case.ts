export interface TestCaseOptions {
  mode?: 'skip' | 'only';
  // In case the value does not display as a string
  description?: string;
}

export const buildTestCaseRunner = (
  expectedResult: unknown,
  act: (testInput: unknown) => unknown,
) => {
  return (value: unknown, { mode, description }: TestCaseOptions = {}) => {
    let testRunner = it;

    if (mode === 'only') {
      testRunner = test.only;
    }

    if (mode === 'skip') {
      testRunner = test.skip;
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const descriptionToUse = description || `${value}`;

    describe(descriptionToUse, () => {
      testRunner(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `should return the expected result [${expectedResult}]`,
        () => {
          const result = act(value);

          expect(result).toEqual(expectedResult);
        },
      );
    });
  };
};
