import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { EncryptionService } from '../crypto';

// TODO can we make this functional middleware instead of adapting to Nest at the lib level?
@Injectable()
export class PasscodeMiddleware implements NestMiddleware {
  constructor(private readonly encryptionService: EncryptionService) {}

  use(req: Request, _res: Response, next: (error?: any) => void) {
    const { headers } = req;

    const authorization = headers.authentication as string;

    const authorizationParts = authorization?.split(' ') || [];

    if (authorizationParts.length !== 2 || authorizationParts[0] !== 'Basic') {
      return next();
    }

    const passcode = authorizationParts[1];

    const hash = this.encryptionService.encrypt(passcode);

    (req.body as { hashedPasscode: string }).hashedPasscode = hash;

    return next();
  }
}
