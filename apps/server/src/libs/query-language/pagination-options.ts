import { NonNegativeInteger } from '../data-types';

export class PaginationOptions {
  @NonNegativeInteger({
    label: 'page',
    description: `the page of results the user is requesting`,
  })
  page: number;

  @NonNegativeInteger({
    label: 'page size',
    description: `the number of results on a single page`,
  })
  pageSize: number; // documents (rows \ entities ) per page

  // This is a response concern, not a request concern
  //   @NonNegativeInteger()
  //   count: number;
}
