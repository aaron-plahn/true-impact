import { DynamicModule, Module } from '@nestjs/common';
import { SuperTokensModuleAsyncOptions } from 'node_modules/supertokens-nestjs/dist/supertokens.types';
import { SuperTokensModule } from 'supertokens-nestjs';
import { SupertokensAuthService } from './supertokens';

@Module({
  imports: [],
  providers: [],
  exports: [],

  controllers: [],
})
export class AuthModule {
  static forRootAsync(options: SuperTokensModuleAsyncOptions): DynamicModule {
    return {
      module: AuthModule,
      global: options.global || true,
      imports: [SuperTokensModule.forRootAsync(options)],
      providers: [SupertokensAuthService],
      exports: [SupertokensAuthService],
    };
  }
}
