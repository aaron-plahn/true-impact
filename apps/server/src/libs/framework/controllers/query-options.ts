import {
  NestedDataType,
  TrueImpactDataExample,
} from '../../../libs/data-types';
import {
  AndQueryFilterCondition,
  ConditionalBlockType,
  LogicalOperator,
  PaginationOptions,
} from '../../../libs/query-language';

@TrueImpactDataExample<QueryOptions>({
  example: {
    pagination: {
      page: 1,
      pageSize: 10,
    },
    filter: {
      type: ConditionalBlockType.AND,
      conditions: [
        {
          type: ConditionalBlockType.SIMPLE,
          field: 'name',
          operator: LogicalOperator.TEXT_INCLUDES,
          params: ['Billy'],
        },
        {
          type: ConditionalBlockType.SIMPLE,
          field: 'age',
          operator: LogicalOperator.EQUALS,
          // can't the user provide a true number?
          params: ['72'],
        },
      ],
    },
  },
})
export class QueryOptions {
  @NestedDataType(() => PaginationOptions, {
    label: 'pagination options',
    description:
      'allows the user to specify how many results should be returned per page and which page should be returned',
  })
  pagination?: PaginationOptions;

  @NestedDataType(() => AndQueryFilterCondition, {
    label: 'filter',
    /**
     * Currently we only support sending `AND` filters, but in the future, we should support
     * any filter our query langauge supports.
     */
    description: `a user defined filter for the target list (for active search)`,
    isOptional: true,
  })
  filter?: AndQueryFilterCondition;
}
