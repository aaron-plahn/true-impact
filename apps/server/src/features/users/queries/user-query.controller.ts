import { AuthenticatedUserGuard, RbacAuthGuard } from '../../../auth/guards';
import {
  BadUserInputFilter,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '../../../libs/framework';
import { UserQueryService } from './user-query.service';

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('users')
export class UserQueryController {
  constructor(private readonly queryService: UserQueryService) {}

  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @DetailQueryEndpoint()
  fetchById(@IdParam() id: string) {
    return this.queryService.fetchById(id);
  }
}
