import { UnauthorizedException } from '@nestjs/common';
import {
  SuperTokensModuleOptions,
  SuperTokensModuleOptionsFactory,
} from 'node_modules/supertokens-nestjs/dist/supertokens.types';
import { isNonEmptyString } from 'src/libs/data-types';
import Dashboard from 'supertokens-node/recipe/dashboard';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import { ConfigService, Injectable } from '../../libs/framework';

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
        ), // TODO force the tenant ID just to be safe? (even though we use single-tenancy)
        // TODO throw if a secure key is not found
        apiKey: this.configService.getOrThrow('SUPERTOKENS_API_KEYS'),
      },
      appInfo: {
        appName: 'True Impact Authentication Server',
        apiDomain: `${this.configService.get('API_DOMAIN', 'http://localhost')}:${this.configService.get('API_PORT', 3001)}`,
        apiBasePath: '/auth',
        origin: `${this.configService.get('CLIENT_DOMAIN', 'http://localhost')}:${this.configService.get('CLIENT_PORT', 8080)}`,
        // websiteDomain: 'http://localhost:4200',
        websiteBasePath: '/auth',
      },
      recipeList: [
        Dashboard.init(),
        EmailPassword.init({
          override: {
            apis: (originalImplementation) => {
              return {
                ...originalImplementation,
                signInPOST: async function (input) {
                  if (typeof originalImplementation.signInPOST !== 'function') {
                    throw new Error(
                      `Unexpected error when configuring Supertokens. signInPOST was missing a default implementation.`,
                    );
                  }

                  const result = await originalImplementation.signInPOST(input);

                  if (result.status !== 'OK') {
                    throw new UnauthorizedException();
                  }

                  return result;
                },
              };
            },
          },
          signUpFeature: {
            formFields: [
              {
                id: 'email',
                // TODO break this out and unit test it
                validate: async (value: unknown, _tenantId: string) => {
                  // This is just to silence TS
                  await Promise.resolve();
                  if (!isNonEmptyString(value)) {
                    return `Username must contain non-empty text.`;
                  }
                  if (value.length > 20) {
                    /**
                     * Out of an abundance of caution, we prevent long text input
                     * from reaching the regex below.
                     */
                    return `Username must be 20 characters or less.`;
                  }
                  /**
                   * We use only bounded operators, no nesting, and fixed length limits
                   * here. There is no risk of a ReDos.
                   */
                  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
                  if (!usernameRegex.test(value)) {
                    return 'Username must be 3-20 alphanumeric characters or underscores.';
                  }
                  return undefined; // Means valid
                },
              },
            ],
          },
        }),
        Session.init({
          getTokenTransferMethod: () => 'cookie',
        }),
      ],
    };

    return staticConfig;
  }
}
