/* eslint-disable prettier/prettier */
import { Customer as PrismaCustomer } from '@prisma/client';

import { Customer } from '../entities/customer.entity';

export abstract class CustomerMapper {
  static toHTTP(
    customer: PrismaCustomer,
    activeTableSessionId?: string | null,
  ): Customer {
    return {
      id: customer.id,
      onesignal_id: '',
      name: customer.name,
      username: customer.username,
      email: customer.email,
      activeTableSessionId: activeTableSessionId ?? null,
      cart: customer.cart,
      createdAt: customer.createdAt,
    };
  }
}
