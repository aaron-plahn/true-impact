import { UnauthorizedException } from '@nestjs/common';
import {
  SuperTokensModuleOptions,
  SuperTokensModuleOptionsFactory,
} from 'node_modules/supertokens-nestjs/dist/supertokens.types';
import Dashboard from 'supertokens-node/recipe/dashboard';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../libs/data-types';
import { ConfigService, Injectable } from '../../libs/framework';
import { validateNewUsername } from '../validation';

const MINIMUM_API_KEY_LENGTH = 20;

@Injectable()
export class SupertokensConfigService implements SuperTokensModuleOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createSuperTokensModuleOptions(): SuperTokensModuleOptions {
    const apiKey = this.configService.getOrThrow<string>(
      'SUPERTOKENS_API_KEYS',
    );

    const listOfAllKeys = apiKey.split(',');

    const invalidKeyErrors = listOfAllKeys.flatMap((key, index) => {
      if (key.length < MINIMUM_API_KEY_LENGTH) {
        return [
          new TrueImpactError(
            `Invalid Supertokens API key encoutered at index [${index}]. Every key in the list must have at least 20 characters.`,
          ),
        ];
      }

      return [];
    });

    if (invalidKeyErrors.length > 0) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(
          `Invalid Supertokens config [SUPERTOKENS_API_KEYS]`,
        ),
        ...invalidKeyErrors,
      ]);
    }

    const staticConfig: SuperTokensModuleOptions = {
      framework: 'express',
      supertokens: {
        connectionURI: this.configService.get(
          'SUPERTOKENS_CONNECTION_URI',
          'http://supertokens:3567',
        ), // TODO force the tenant ID to be `public` just to be safe? (even though we use single-tenancy)
        apiKey,
      },
      appInfo: {
        appName: 'True Impact Authentication Server',
        apiDomain: `${this.configService.get('API_DOMAIN', 'http://localhost')}:${this.configService.get('API_PORT', 3001)}`,
        apiBasePath: '/auth',
        origin: `${this.configService.get('CLIENT_DOMAIN', 'http://localhost')}:${this.configService.get('CLIENT_PORT', 8080)}`,
        // We use a custom login UX, so the following is not necessary.
        // websiteDomain: 'http://localhost:4200',
        websiteBasePath: '/auth',
      },
      recipeList: [
        Dashboard.init(),
        EmailPassword.init({
          /**
           * TODO Consider refactoring to wire up our own controller that leverages Supertokens instead.
           */
          override: {
            apis: (originalImplementation) => {
              return {
                ...originalImplementation,
                // TODO adapt this to our existing API
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
                validate: async (value: unknown, _tenantId: string) => {
                  const allErrors = validateNewUsername(value);

                  if (allErrors.length === 0) return undefined; // Means valid

                  // The Promise wrapper is just to silence TS
                  return Promise.resolve(
                    new TrueImpactError(
                      `Invalid username.`,
                      allErrors,
                    ).toString(),
                  );
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
