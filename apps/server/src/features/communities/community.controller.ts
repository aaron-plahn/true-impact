import type { ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../libs/cqrs-es';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import {
  BadUserInputFilter,
  Body,
  Controller,
  DetailQueryEndpoint,
  IdParam,
  IndexQueryEndpoint,
  Post,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  TestSetupEndpoint,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';
import { CommunityQueryService, CommunityViewModelClientDto } from './queries';

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('communities')
export class CommunityController {
  constructor(
    private readonly commandHandlerService: CommandHandlerService,
    private readonly communityQueryService: CommunityQueryService,
  ) {}

  // TODO @CommandExecutionEndpoint
  @Post('commands')
  async executeCommand(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }

  @DetailQueryEndpoint()
  async fetchById(
    @IdParam() id: string,
  ): Promise<CommunityViewModelClientDto | TrueImpactError | null> {
    const result = await this.communityQueryService.fetchById(id);

    return result;
  }

  @IndexQueryEndpoint()
  async fetchMany(): Promise<CommunityViewModelClientDto[] | TrueImpactError> {
    const result = await this.communityQueryService.fetchMany();

    return result;
  }

  @TestSetupEndpoint()
  async testSetup(): Promise<'OK'> {
    if (process.env.NODE_ENV !== 'test') {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot access test setup helpers in the environment [${process.env.NODE_ENV}]`,
        ),
      ]);
    }

    // @ts-expect-error This will only work if the private, concrete dependency has a `clear` method (not for the production implementation)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.communityQueryService.commandRepository.clear();

    return 'OK';
  }
}
