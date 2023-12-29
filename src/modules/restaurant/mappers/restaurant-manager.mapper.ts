import { RestaurantManager as PrismaRestaurantManager } from '@prisma/client';

import { RestaurantManager } from '../entities/restaurant-manager.entity';

export abstract class RestaurantManagerMapper {
  static toHTTP(restaurantManager: PrismaRestaurantManager): RestaurantManager {
    return {
      id: restaurantManager.id,
      name: restaurantManager.name,
      username: restaurantManager.username,
      restaurantId: restaurantManager.restaurantId,
      isOwner: restaurantManager.isOwner,
      createdAt: restaurantManager.createdAt,
    };
  }
}
