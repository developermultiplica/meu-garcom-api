import { Module } from '@nestjs/common';

import { EncryptionModule } from '~/infra/encryption/encryption.module';
import { PrismaModule } from '~/infra/prisma/prisma.module';

import { WaiterController } from './controllers/waiter.controller';
import { WaiterService } from './waiter.service';

@Module({
  imports: [PrismaModule, EncryptionModule],
  controllers: [WaiterController],
  providers: [WaiterService],
  exports: [WaiterService],
})
export class WaiterModule {}
