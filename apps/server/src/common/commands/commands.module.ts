import { Module } from '../../libs/framework';

@Module({
  controllers: [
    /**
     * TODO We may want a global `commands` endpoint to execute bulk-jobs.
     * For now, each feature controller has its own `CommandHandlerService`
     * whose available commands are scoped to the aggregate roots available
     * in said feature slice.
     */
    // CommandsController
  ],
  providers: [],
  exports: [],
})
export class CommandsModule {}
