/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { isPast } from 'date-fns';

import { PrismaService } from '~/infra/prisma/prisma.service';

import {
  ProductUseCase,
  ProductWithIncludes,
} from '../abstractions/product-use-case';
import { InactiveRestaurantException } from '../errors/inactive-restaurant-exception';
import { RestaurantManagerNotFoundException } from '../errors/restaurant-manager-not-found-exception';
import { RestaurantNotFoundException } from '../errors/restaurant-not-fount-exception';

type Request = {
  restaurantManagerId: string;
  page: number;
};

type Response = {
  products: ProductWithIncludes[];
  matchCount: number;
  numberOfPages: number;
};

@Injectable()
export class ListProductsByRestaurantManagerId extends ProductUseCase<
  Request,
  Response
> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({ restaurantManagerId, page }: Request): Promise<Response> {
    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: { id: restaurantManagerId },
    });

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id: restaurantManager.restaurantId,
      },
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException();
    }

    if (isPast(restaurant.expiresAt)) {
      throw new InactiveRestaurantException();
    }

    const [products, matchCount] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          restaurantId: restaurant.id,
        },
        include: this.productInclude,
        take: 10,
        skip: (page - 1) * 10,
      }),
      this.prisma.product.count({
        where: {
          restaurantId: restaurant.id,
        },
      }),
    ]);

    const numberOfPages = Math.ceil(matchCount / 10);

    return {
      products,
      matchCount,
      numberOfPages,
    };
  }
}
