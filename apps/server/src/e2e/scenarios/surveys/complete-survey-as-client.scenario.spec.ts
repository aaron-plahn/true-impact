describe(`Survey Completion Scenarios`, () => {
  describe(`when the scenario is valid`, () => {
    describe(`when completing the survey for the first time`, () => {
      it.todo(`should have a comprehensive survey completion scenario`);
    });

    describe(`when completing the survey for an additional time`, () => {
      it.todo(`should add a complete, second survey completion record`);
    });
  });

  describe(`when the scenario is invalid`, () => {
    describe(`when beginning a survey`, () => {
      describe(`when the target survey does not exist`, () => {
        it.todo(`should return the expected error response`);
      });

      describe(`when the target survey is not published`, () => {
        it.todo(`should return the expected error response`);
      });
    });

    describe(`when responding to a top-level survey question`, () => {
      describe(`when the survey completion record does not exist`, () => {
        it.todo(`should return the expected error response`);
      });

      describe(`when there is no question with the given label`, () => {
        it.todo(`should return the expected error response`);
      });

      describe(`when the question already has a response`, () => {
        it.todo(`should return the expected error response`);
      });

      describe(`when the question is not next in line`, () => {
        it.todo(`should return the expected error response`);
      });
    });

    describe(`when responding to a follow-up survey question`, () => {
      describe(`when the survey completion record does not exist`, () => {
        it.todo(`should return the expected error response`);
      });

      describe(`when there is no question with the given label`, () => {
        it.todo(`should return the expected error response`);
      });

      describe(`when the question already has a response`, () => {
        it.todo(`should return the expected error response`);
      });

      describe(`when the question is not next in line`, () => {
        it.todo(`should return the expected error resposne`);
      });

      describe(`when the follow-up question should not have been asked based on the parent question's response`, () => {
        it.todo(`should return the expected error response`);
      });
    });

    describe(`when abandoning a survey`, () => {
      describe(`when the survey completion record does not exist`, () => {
        it.todo(`should return the expected error response`);
      });

      // TODO survey response instead of completion record?
      describe(`when the draft survey completion record has already been abandoned`, () => {
        it.todo(`should return the expected error response`);
      });

      describe(`when the survey completion record has already been submitted`, () => {
        it.todo(`should return the expected error response`);
      });
    });
  });
});
