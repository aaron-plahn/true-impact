import { AuthenticatedUserGuard, RbacAuthGuard } from 'src/auth/guards';
import {
  Controller,
  DetailQueryEndpoint,
  IdParam,
  UseGuards,
} from 'src/libs/framework';
import { GroupProgramQueryService } from '../queries/group-program-query.service';

@Controller('group-programs')
export class GroupProgramQueryController {
  constructor(
    private readonly groupProgramQueryService: GroupProgramQueryService,
  ) {}

  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @DetailQueryEndpoint()
  async fetchById(@IdParam() id: string) {
    const result = await this.groupProgramQueryService.fetchById(id);

    return result;
  }
}
