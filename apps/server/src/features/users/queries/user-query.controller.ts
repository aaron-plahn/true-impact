import {
  BadUserInputFilter,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  UseFilters,
  UseInterceptors,
} from '../../../libs/framework';
import { UserQueryService } from './user-query.service';

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('users')
export class UserQueryController {
  constructor(private readonly queryService: UserQueryService) {}

  @DetailQueryEndpoint()
  fetchById(@IdParam() id: string) {
    return this.queryService.fetchById(id);
  }
}
