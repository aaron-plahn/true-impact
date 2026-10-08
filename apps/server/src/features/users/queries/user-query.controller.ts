import { UnauthorizedException } from '@nestjs/common';
import { Session } from 'supertokens-nestjs';
import { type SessionContainer } from 'supertokens-node/recipe/session';
import {
  AuthenticatedUserGuard,
  OptionalUserGuard,
  RbacAuthGuard,
} from '../../../auth/guards';
import {
  BadUserInputFilter,
  Controller,
  DetailQueryEndpoint,
  Get,
  IdParam,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '../../../libs/framework';
import { UserQueryService } from './user-query.service';
import { UserViewModelClientDto } from './user.view-model';

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

  @UseGuards(OptionalUserGuard)
  @Get('who-am-i')
  async whoAmI(
    // can we not use the auth gurad for this?
    @Session()
    session: SessionContainer,
  ): Promise<UserViewModelClientDto> {
    const userId = session.getUserId();

    const searchResult = await this.queryService.fetchById(userId);

    if (!searchResult) {
      throw new UnauthorizedException();
    }

    return searchResult;
  }
}
