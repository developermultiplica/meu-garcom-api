/* eslint-disable prettier/prettier */
import { Waiter as PrismaWaiter } from '@prisma/client';

import { Waiter } from '../entities/waiter.entity';

export abstract class WaiterMapper {
  static toHTTP(waiter: PrismaWaiter): Waiter {
    return {
      id: waiter.id,
      onesignal_id: '',
      name: waiter.name,
      username: waiter.username,
      restaurantId: waiter.restaurantId,
    };
  }
}
