import { Injectable } from '@nestjs/common';
import { OrderProductStatus } from '@prisma/client';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { UnauthorizedException } from '~/modules/auth/errors/UnauthorizedException';
import { RestaurantManagerNotFoundException } from '~/modules/restaurant/errors/restaurant-manager-not-found-exception';

import {
  TableSessionUseCase,
  TableSessionWithIncludes,
} from '../abstractions/table-session-use-case';
import { OrderProductNotFoundException } from '../errors/OrderProductNotFoundException';

type Request = {
  restaurantManagerId: string;
  orderId: string;
  productId: string;
};

@Injectable()
export class CancelOrderProduct extends TableSessionUseCase<Request> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({
    restaurantManagerId,
    productId,
    orderId,
  }: Request): Promise<TableSessionWithIncludes> {
    const orderProduct = await this.prisma.orderProduct.findUnique({
      where: {
        productId_orderId: {
          orderId,
          productId,
        },
      },
      include: {
        order: {
          include: {
            tableSession: {
              include: {
                table: true,
              },
            },
          },
        },
      },
    });

    if (!orderProduct) {
      throw new OrderProductNotFoundException();
    }

    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: {
        id: restaurantManagerId,
      },
    });

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    if (
      orderProduct.order.tableSession.table.restaurantId !==
      restaurantManager.restaurantId
    ) {
      throw new UnauthorizedException();
    }

    await this.prisma.orderProduct.update({
      where: {
        productId_orderId: {
          orderId: orderProduct.orderId,
          productId: orderProduct.productId,
        },
      },
      data: {
        status: OrderProductStatus.CANCELED,
        canceledAt: new Date(),
      },
    });

    const updatedTableSession = await this.prisma.tableSession.findUnique({
      where: {
        id: orderProduct.order.tableSessionId,
      },
      include: this.tableSessionInclude,
    });

    return updatedTableSession!;
  }
}
