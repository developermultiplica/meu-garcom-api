/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infra/prisma/prisma.service';

import {
  ProductUseCase,
  ProductWithIncludes,
} from '../abstractions/product-use-case';
import { RestaurantNotFoundException } from '../errors/restaurant-not-fount-exception';

type Request = {
  restaurantId: string;
};

@Injectable()
export class GetProductsByRestaurantId extends ProductUseCase<
  Request,
  ProductWithIncludes[]
> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({ restaurantId }: Request): Promise<ProductWithIncludes[]> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException();
    }

    const produtos = await this.prisma.product.findMany({
      where: {
        restaurantId,
        isAvailable: true,
      },
      include: this.productInclude,
    });

    const produtosFiltrados = produtos.filter((produto) => {
      return (
        produto.availabilityType !== 'QUANTITY' ||
        (produto.availabilityType === 'QUANTITY' && produto.availableAmount !== 0)
      );
    });

    return produtosFiltrados;
  }
}
