import { BadRequestException, Injectable } from '@nestjs/common';
import { isPast } from 'date-fns';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { UnauthorizedException } from '~/modules/auth/errors/UnauthorizedException';
import { InactiveRestaurantException } from '~/modules/restaurant/errors/inactive-restaurant-exception';
import { RestaurantManagerNotFoundException } from '~/modules/restaurant/errors/restaurant-manager-not-found-exception';
import { RestaurantNotFoundException } from '~/modules/restaurant/errors/restaurant-not-fount-exception';
import { WaiterNotFoundException } from '~/modules/waiter/errors/WaiterNotFoundException';

import {
  TableUseCase,
  TableWithIncludes,
} from '../abstractions/table-use-case';
import { TableNotFoundException } from '../errors/TableNotFoundException';

type Request = {
  restaurantManagerId: string;
  tableId: string;
  waiterId: string | null;
};

@Injectable()
export class SignTableToWaiter extends TableUseCase<Request> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({
    restaurantManagerId,
    tableId,
    waiterId,
  }: Request): Promise<TableWithIncludes> {
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

    if (isPast(restaurant.expiresAt)) {
      throw new InactiveRestaurantException();
    }

    const table = await this.prisma.table.findUnique({
      where: {
        id: tableId,
      },
    });

    if (!table) {
      throw new TableNotFoundException();
    }

    if (table.restaurantId !== restaurant.id) {
      throw new UnauthorizedException();
    }

    if (waiterId) {
      const waiter = await this.prisma.waiter.findUnique({
        where: {
          id: waiterId,
        },
      });

      if (!waiter) {
        throw new WaiterNotFoundException();
      }

      if (waiter.restaurantId !== restaurant.id) {
        throw new BadRequestException(
          'Apenas garçons do estabelecimento podem ser responsáveis pelas mesas',
        );
      }
    }

    const updatedTable = await this.prisma.table.update({
      where: {
        id: tableId,
      },
      data: {
        waiterId,
      },
      include: this.tableInclude,
    });

    return {
      ...updatedTable,
      tableSession: updatedTable.tableSessions[0] ?? null,
    };
  }
}
