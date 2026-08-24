import { OnModuleInit, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { AuthenticatedUserGuard, RbacAuthGuard } from 'src/auth/guards';
import type { ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../libs/cqrs-es';
import {
  buildTestInstance,
  convertToOpenApiSchema,
  getDataSchemaFromClassCtor,
  TrueImpactBadUserInputError,
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
import { FlagQueryService, FlagViewModelClientDto } from './queries';

const schema = convertToOpenApiSchema(
  getDataSchemaFromClassCtor(FlagViewModelClientDto),
);

const example = buildTestInstance(FlagViewModelClientDto);

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('flags')
export class FlagController implements OnModuleInit {
  constructor(
    private readonly flagQueryService: FlagQueryService,
    private readonly commandHandlerService: CommandHandlerService,
  ) {}

  // TODO @CommandExecutionEndpoint
  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @Post('commands')
  async executeCommand(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    const result = await this.commandHandlerService.execute(fsa);

    if (!(result instanceof Error)) {
      return result;
    }

    if (!(result instanceof TrueImpactBadUserInputError)) {
      return new TrueImpactBadUserInputError([result]);
    }

    return result;
  }

  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @DetailQueryEndpoint()
  @ApiOkResponse({
    schema,
    example,
  })
  async fetchById(
    @IdParam()
    id: string,
  ): Promise<FlagViewModelClientDto | TrueImpactError | null> {
    const result = await this.flagQueryService.fetchById(id);

    return result;
  }

  // TODO do we want to use an interceptor to convert view models to client-facing DTOs insead of doing it explicitly lower down?
  @UseGuards(AuthenticatedUserGuard, RbacAuthGuard)
  @IndexQueryEndpoint()
  @ApiOkResponse({
    isArray: true,
    schema,
    example: [example],
  })
  async fetchMany(): Promise<FlagViewModelClientDto[] | TrueImpactError> {
    const result = await this.flagQueryService.fetchMany();

    return result;
  }

  // TODO auth guard
  @TestSetupEndpoint()
  async testSetup(): Promise<'OK'> {
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'e2e') {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `You cannot access test setup helpers in the environment [${process.env.NODE_ENV}]`,
        ),
      ]);
    }

    // @ts-expect-error This will only work if the private, concrete dependency has a `clear` method (not for the production implementation)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.flagQueryService.flagCommandRepository.clear();

    return 'OK';
  }

  onModuleInit() {
    this.commandHandlerService.buildApiDocs(FlagController);
  }
}
