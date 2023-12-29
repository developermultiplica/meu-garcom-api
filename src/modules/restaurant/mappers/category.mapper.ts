import { Category as PrismaCategory } from '@prisma/client';

import { Category } from '../entities/category.entity';

export abstract class CategoryMapper {
  static toHTTP(category: PrismaCategory): Category {
    return {
      id: category.id,
      restaurantId: category.restaurantId,
      name: category.name,
    };
  }
}
