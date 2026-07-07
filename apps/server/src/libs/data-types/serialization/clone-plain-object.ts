import { DeepOverrides } from '../utility-types';

export const clonePlainObject = <
  T extends object,
  U extends DeepOverrides<T>,
  V extends keyof T,
>(
  input: T,
  overrides: U,
  propsToRemove: V[] = [],
): Omit<T, V> => {
  const cloned = JSON.parse(JSON.stringify(input)) as T;

  for (const propToRemove of propsToRemove) {
    delete cloned[propToRemove];
  }

  /**
   * In this case, the property was `undefined` to start with, so
   * we simply set the desired override.
   */
  Object.entries(overrides).forEach(([key, newValue]: [string, unknown]) => {
    if (!(key in input)) {
      /**
       * We use allow-list based schema validation on all user input. There is no risk of superfluous
       * property injection here.
       */
      // nosemgrep: javascript.lang.security.insecure-object-assign.insecure-object-assign
      Object.assign(cloned, {
        [key]: newValue,
      });

      return;
    }

    const newValueType = typeof newValue;

    /**
     * Primitive values do not require recursion
     */
    if (
      newValueType === 'boolean' ||
      newValueType === 'bigint' ||
      newValueType === 'number' ||
      newValueType === 'string' ||
      newValueType === 'symbol' ||
      newValueType === 'undefined' ||
      newValue === null
    ) {
      Object.assign(cloned, {
        [key]: newValue,
      });

      return;
    }

    /**
     * We do not deal with cloning instances at this level.
     */
    if (newValueType === 'function') {
      return;
    }

    /**
     * Here we recurse as we have an object-valued property.
     */
    Object.assign(cloned, {
      [key]: clonePlainObject(cloned[key], newValue),
    });
  });

  return cloned;
};
