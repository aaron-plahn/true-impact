import {
  PaginationOptions,
  QueryFilterCondition,
} from 'src/libs/query-language';

export class QueryOptions {
  pagination: PaginationOptions;
  filter?: QueryFilterCondition;
}
