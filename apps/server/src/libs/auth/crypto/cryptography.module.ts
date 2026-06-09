import { Global } from '@nestjs/common';
import { Module } from '../../framework';
import { EncryptionService } from './encryption.service';

@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class CryptographyModule {}
