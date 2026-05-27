import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'node:crypto';
import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from '../../../libs/data-types';

@Injectable()
export class EncryptionService {
  readonly #key;

  readonly #iv = crypto.randomBytes(16);

  // TODO - algorithm
  constructor(private readonly configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('TI_ENCRYPTION_KEY');

    if (!encryptionKey) {
      throw new TrueImpactRuntimeException([
        new TrueImpactError(`Missing encryption key for passcode generation`),
      ]);
    }

    this.#key = crypto
      .createHash('sha512')
      .update(encryptionKey)
      .digest('hex')
      .substring(0, 32);
  }

  generatePasscode(): string {
    // make this part of the config
    const passcodeLengthInBytes = 16;

    return crypto.randomBytes(passcodeLengthInBytes).toString('hex');
  }

  generateSessionId(): string {
    return this.generatePasscode();
  }

  encrypt(plain: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.#key),
      this.#iv,
    );

    let encrypted = cipher.update(plain, 'utf-8', 'hex');

    encrypted += cipher.final('hex');

    return this.#iv.toString('hex') + encrypted;
  }
}
