import { UnauthorizedException } from '@nestjs/common';
import { Session } from 'supertokens-nestjs';
import type { SessionContainer } from 'supertokens-node/recipe/session';
import { AdminRbacAuthGuard, AuthGuard } from '../../../auth/guards';
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

  @UseGuards(
    new AuthGuard({
      // can we make this true and avoid the !userId check?
      sessionRequired: false,
    }),
  )
  @Get('who-am-i')
  async whoAmI(
    @Session()
    session: SessionContainer,
  ): Promise<UserViewModelClientDto> {
    const userId = session?.getUserId();

    if (!userId) {
      throw new UnauthorizedException();
    }

    const searchResult = await this.queryService.fetchById(userId);

    if (!searchResult) {
      throw new UnauthorizedException();
    }

    return searchResult;
  }

  @UseGuards(AdminRbacAuthGuard)
  @DetailQueryEndpoint()
  fetchById(@IdParam() id: string) {
    return this.queryService.fetchById(id);
  }
}
