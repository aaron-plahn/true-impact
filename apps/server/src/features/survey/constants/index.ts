export const SURVEY_AGGREGATE_TYPE = 'survey';

export const SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN =
  'SURVEY_COMMAND_REPOSITORY_DEPENDENCY_TOKEN';

// TODO casing convention for aggregate types
// TODO how do we handle labels?
export const SURVEY_RESPONSE_AGGREAGTE_TYPE = 'surveyResponse';

export const DONE = Symbol('SURVEY COMPLETE');

export type DONE = typeof DONE;
