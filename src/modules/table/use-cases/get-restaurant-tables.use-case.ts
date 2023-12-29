import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { RestaurantManagerNotFoundException } from '~/modules/restaurant/errors/restaurant-manager-not-found-exception';
import { RestaurantNotFoundException } from '~/modules/restaurant/errors/restaurant-not-fount-exception';

import {
  TableUseCase,
  TableWithIncludes,
} from '../abstractions/table-use-case';

type Request = {
  restaurantManagerId: string;
};

type Response = TableWithIncludes[];

@Injectable()
export class GetRestaurantTables extends TableUseCase<Request, Response> {
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
    });

    if (!restaurant) {
      throw new RestaurantNotFoundException();
    }
    console.log('Restaurante =>' + JSON.stringify(restaurant));

    const restaurantTables = await this.prisma.table.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      include: this.tableInclude,
    });

    const mappedTables = restaurantTables.map<TableWithIncludes>((table) => {
      return {
        id: table.id,
        number: table.number,
        restaurantId: table.restaurantId,
        waiterId: table.waiterId,
        tableSession:
          table.tableSessions.length > 0 ? table.tableSessions[0] : null,
      };
    });

    return mappedTables;
  }
}
