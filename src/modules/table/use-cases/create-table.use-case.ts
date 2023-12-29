import { Injectable } from '@nestjs/common';
import { Table } from '@prisma/client';
import { isPast } from 'date-fns';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { InactiveRestaurantException } from '~/modules/restaurant/errors/inactive-restaurant-exception';
import { MaxTablesExcepion } from '~/modules/restaurant/errors/max-tables-exception';
import { RestaurantManagerNotFoundException } from '~/modules/restaurant/errors/restaurant-manager-not-found-exception';
import { RestaurantNotFoundException } from '~/modules/restaurant/errors/restaurant-not-fount-exception';

import { TableUseCase } from '../abstractions/table-use-case';

type Request = {
  restaurantManagerId: string;
  tables: number;
};

type Response = Table;

@Injectable()
export class CreateTable extends TableUseCase<Request, Response> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({ restaurantManagerId }: Request): Promise<Response> {
    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: {
        id: restaurantManagerId,
      },
    });

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id: restaurantManager.restaurantId,
      },
      include: {
        tables: true,
      },
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException();
    }
    console.log(restaurant.expiresAt);

    if (isPast(restaurant.expiresAt)) {
      throw new InactiveRestaurantException();
    }

    const tableWithHighestRestaurantTableNumber =
      await this.prisma.table.findFirst({
        where: {
          restaurantId: restaurant.id,
        },
        orderBy: {
          number: 'desc',
        },
      });
    const numberTable = tableWithHighestRestaurantTableNumber?.number || 1;
    if (restaurant.maxTables <= numberTable) {
      throw new MaxTablesExcepion();
    }
    return this.prisma.table.create({
      data: {
        number: tableWithHighestRestaurantTableNumber
          ? tableWithHighestRestaurantTableNumber.number + 1
          : 1,
        restaurantId: restaurant.id,
      },
    });
  }
}
