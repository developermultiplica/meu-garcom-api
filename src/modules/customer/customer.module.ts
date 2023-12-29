/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';

import { EncryptionModule } from '~/infra/encryption/encryption.module';
import { PrismaModule } from '~/infra/prisma/prisma.module';

import { CustomerController } from './controllers/customer.controller';
import { CustomerService } from './customer.service';

@Module({
  imports: [PrismaModule, EncryptionModule],
  controllers: [
    CustomerController,
  ],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
