/* eslint-disable prettier/prettier */
import { Restaurant as PrismaRestaurant } from '@prisma/client';

import { Restaurant } from '../entities/restaurant.entity';

export abstract class RestaurantMapper {
  static toHTTP(restaurant: PrismaRestaurant): Restaurant {
    return {
      id: restaurant.id,
      name: restaurant.name,
      bannerUrl: restaurant.bannerUrl,
      expiresAt: restaurant.expiresAt,
      createdAt: restaurant.createdAt,
      maxTables: restaurant.maxTables,
    };
  }
}
