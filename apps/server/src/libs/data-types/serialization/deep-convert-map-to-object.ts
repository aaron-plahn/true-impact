import { TrueImpactError, TrueImpactRuntimeException } from '../error-handling';
import { DeepMapToRecord } from '../utility-types';
import { isNonEmptyString } from '../validation';

export const deepConvertMapToObject = <
  K extends string,
  V,
  T extends Map<K, V>,
>(
  input: T,
): DeepMapToRecord<T> => {
  const result = Array.from(input.entries()).reduce(
    (acc: DeepMapToRecord<T>, [k, v]) => {
      if (!isNonEmptyString(k)) {
        throw new TrueImpactRuntimeException([
          new TrueImpactError(
            `keys of type [${typeof k}] cannot be used to index records`,
          ),
        ]);
      }

      if (v instanceof Map) {
        // recurse
        acc[k] = deepConvertMapToObject(v) as DeepMapToRecord<T>[K];

        return acc;
      }

      acc[k] = v as DeepMapToRecord<T>[K];

      return acc;
    },
    {} as DeepMapToRecord<T>,
  );

  return result;
};
