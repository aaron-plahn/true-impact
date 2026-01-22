import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SuperTokensModuleOptions,
  SuperTokensModuleOptionsFactory,
} from 'node_modules/supertokens-nestjs/dist/supertokens.types';
import Dashboard from 'supertokens-node/recipe/dashboard';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';

@Injectable()
export class SupertokensConfigService implements SuperTokensModuleOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createSuperTokensModuleOptions(): SuperTokensModuleOptions {
    const staticConfig: SuperTokensModuleOptions = {
      framework: 'express',
      supertokens: {
        connectionURI: this.configService.get(
          'SUPERTOKENS_CONNECTION_URI',
          'http://supertokens:3567',
        ),
        apiKey: this.configService.get(
          'SUPERTOKENS_API_KEYS',
          'abcdefghijklmnop123456xyz',
        ),
      },
      appInfo: {
        appName: 'True Impact Authentication Server',
        apiDomain: `${this.configService.get('API_DOMAIN', 'http://localhost')}:${this.configService.get('API_PORT', 3001)}`,
        apiBasePath: '/auth',
        origin: `${this.configService.get('CLIENT_DOMAIN', 'http://localhost')}:${this.configService.get('CLIENT_PORT', 8080)}`,
        // websiteDomain: 'http://localhost:4200',
        websiteBasePath: '/auth',
      },
      recipeList: [Dashboard.init(), EmailPassword.init(), Session.init()],
    };

    return staticConfig;
  }
}
