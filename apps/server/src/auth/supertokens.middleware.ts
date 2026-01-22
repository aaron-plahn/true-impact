/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { middleware as supertokensMiddleware } from 'supertokens-node/framework/express';

@Injectable()
export class SupertokensMiddleware implements NestMiddleware {
  supertokensMiddleware: any;

  constructor() {
    this.supertokensMiddleware = supertokensMiddleware();
  }

  use(req: Request, res: any, next: () => void) {
    return this.supertokensMiddleware(req, res, next);
  }
}
