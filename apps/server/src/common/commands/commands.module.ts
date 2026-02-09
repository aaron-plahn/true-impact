import { Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CommandHandlerService } from 'src/libs/cqrs-es';
import { CommandsController } from './commands.controller';

@Module({
  controllers: [CommandsController],
  providers: [
    {
      provide: CommandHandlerService,
      // TODO We need to ensure we can acces the child module's providers in this context
      useFactory: (moduleRef: ModuleRef) =>
        new CommandHandlerService({
          resolve(injectionToken) {
            return moduleRef.get(injectionToken);
          },
        }),
      inject: [ModuleRef],
    },
  ],
  exports: [CommandHandlerService],
})
export class CommandsModule {}
