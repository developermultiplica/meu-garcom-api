import { Module } from '@nestjs/common';

import { EncryptionModule } from '~/infra/encryption/encryption.module';
import { PrismaModule } from '~/infra/prisma/prisma.module';

import { ProviderService } from './provider.service';

@Module({
  imports: [PrismaModule, EncryptionModule],
  providers: [ProviderService],
  exports: [ProviderService],
})
export class ProviderModule {}
