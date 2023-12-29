import { Module } from '@nestjs/common';

import { PasswordEncryptionsService } from './password-encryption.service';

@Module({
  providers: [PasswordEncryptionsService],
  exports: [PasswordEncryptionsService],
})
export class EncryptionModule {}
