import { AdminRbacAuthGuard } from '../../../auth/guards';
import {
  Controller,
  DetailQueryEndpoint,
  IdParam,
  UseGuards,
} from '../../../libs/framework';
import { GroupProgramQueryService } from '../queries';

@Controller('group-programs')
export class GroupProgramQueryController {
  constructor(
    private readonly groupProgramQueryService: GroupProgramQueryService,
  ) {}

  @UseGuards(AdminRbacAuthGuard)
  @DetailQueryEndpoint()
  async fetchById(@IdParam() id: string) {
    const result = await this.groupProgramQueryService.fetchById(id);

    return result;
  }
}
