import { Injectable } from '@nestjs/common';
import Dashboard from 'supertokens-node/recipe/dashboard';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import {
  SuperTokensModuleOptions,
  SuperTokensModuleOptionsFactory,
} from 'node_modules/supertokens-nestjs/dist/supertokens.types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupertokensConfigService implements SuperTokensModuleOptionsFactory {
  constructor(private readonly configService: ConfigService){}

  createSuperTokensModuleOptions(): SuperTokensModuleOptions {
    const staticConfig: SuperTokensModuleOptions = {
      framework: 'express',
      supertokens: {
        connectionURI: this.configService.get('SUPERTOKENS_CONNECTION_URI','http://supertokens:3567'),
        apiKey: this.configService.get('SUPERTOKENS_API_KEYS','abcdefghijklmnop123456xyz'),
      },
      appInfo: {
        appName: 'True Impact Authentication Server',
        apiDomain: 'http://localhost:3234',
        apiBasePath: '/auth',
        origin: 'http://localhost',
        // websiteDomain: 'http://localhost:4200',
        websiteBasePath: '/auth',
      },
      recipeList: [Dashboard.init(), EmailPassword.init(), Session.init()],
    };

    return staticConfig;
  }
}
