import { isNonEmptyString, TrueImpactError } from '../../libs/data-types';

export const validateNewUsername = (input: unknown): TrueImpactError[] => {
  if (!isNonEmptyString(input)) {
    return [new TrueImpactError(`Username must contain non-empty text.`)];
  }

  if (input.length > 20) {
    /**
     * Out of an abundance of caution, we prevent long text input
     * from reaching the regex below.
     */
    return [new TrueImpactError(`Username must be 20 characters or less.`)];
  }
  /**
   * We use only bounded operators, no nesting, and fixed length limits
   * here. There is no risk of a ReDos.
   */
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(input)) {
    return [
      new TrueImpactError(
        'Username must be 3-20 alphanumeric characters or underscores.',
      ),
    ];
  }

  return [];
};
