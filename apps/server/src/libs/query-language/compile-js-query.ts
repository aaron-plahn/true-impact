import {
  isNonEmptyString,
  isObject,
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../data-types';
import {
  ConditionalBlockType,
  LogicalOperator,
  QueryFilterCondition,
  SimpleQueryFilterCondition,
} from './query-filter-condition';

type PredicateFunction<T> = (input: T) => boolean;

const compileSimpleQuery = <T>(
  condition: SimpleQueryFilterCondition,
): PredicateFunction<T> => {
  const { operator, params, field } = condition;

  if (params.length !== 1) {
    throw new Error(`TODO should we return this error?`);
  }

  // TODO param[1] => caseSensitive?

  const searchTerms = params[0];

  if (!isNonEmptyString(searchTerms)) {
    throw new Error(`TODO return errors`);
  }

  if (operator === LogicalOperator.TEXT_INCLUDES) {
    return (input: T) => {
      if (!isObject(input)) {
        return false;
      }

      if (!(field in input)) {
        return false;
      }

      const target = input[field as keyof T];

      if (!isNonEmptyString(target)) {
        return false;
      }

      return target.includes(searchTerms);
    };
  }

  const exhastiveCheck: never = operator;

  throw new TrueImpactRuntimeException([
    new TrueImpactError(
      `Unknown operator [${exhastiveCheck as LogicalOperator}] encountered in simple filter block.`,
    ),
  ]);
};

/**
 * A query can be applied in memory using this logic. This can be done on the client or the server (after fetching all results from the database.)
 *
 * Once you have a large number of results, you're going to want to push the query back to the database, in which case
 * you'll need to compile the filter to your database's query language.
 */
export const compileJsQuery = <T>(
  filter: QueryFilterCondition,
): PredicateFunction<T> => {
  const { type: filterBlockType } = filter;

  if (filter.type === ConditionalBlockType.AND) {
    const { conditions } = filter;

    return (input: T) => {
      return conditions.every((condition) => {
        return compileJsQuery(condition)(input);
      });
    };
  }

  if (filter.type === ConditionalBlockType.SIMPLE) {
    return compileSimpleQuery(filter);
  }

  throw new TrueImpactRuntimeException([
    new TrueImpactError(
      `Failed to interpret unknown filter block of type: [${filterBlockType}]`,
    ),
  ]);
};
