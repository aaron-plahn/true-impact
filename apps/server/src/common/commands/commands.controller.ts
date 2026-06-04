import type { ICommandFsa } from '../../libs/cqrs-es';
import { CommandHandlerService, CommandResult } from '../../libs/cqrs-es';
import { TrueImpactBadUserInputError } from '../../libs/data-types';
import {
  BadUserInputFilter,
  Body,
  Controller,
  Post,
  QueryResponseInterceptor,
  ResourceNotFoundFilter,
  UseFilters,
  UseInterceptors,
} from '../../libs/framework';

@UseFilters(ResourceNotFoundFilter, BadUserInputFilter)
@UseInterceptors(QueryResponseInterceptor)
@Controller('commands')
/**
 * We may want to use this to have a single endpoint for all commands, while allowing each
 * module to register its own commands.
 */
export class CommandsController {
  constructor(private readonly commandHandlerService: CommandHandlerService) {}

  @Post('')
  async execute(@Body() fsa: ICommandFsa): Promise<CommandResult> {
    const typeValidationResult = this.commandHandlerService.validate(fsa);

    if (typeValidationResult.length > 0) {
      // TODO Do we want to state that this is a command execution error?
      return new TrueImpactBadUserInputError(typeValidationResult);
    }

    const result = await this.commandHandlerService.execute(fsa);

    return result;
  }
}
