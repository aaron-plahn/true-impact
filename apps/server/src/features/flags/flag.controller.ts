import { CommandHandlerService } from 'src/libs/cqrs-es';
import { Controller } from '../../libs/framework';

@Controller()
export class FlagController {
  constructor(
    private readonly flagQueryService,
    private readonly commandHandlerService: CommandHandlerService,
  ) {}
}
