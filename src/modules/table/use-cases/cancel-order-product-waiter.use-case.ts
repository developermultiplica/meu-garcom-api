/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { OrderProductStatus } from '@prisma/client';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { UnauthorizedException } from '~/modules/auth/errors/UnauthorizedException';
import { WaiterNotFoundException } from '~/modules/waiter/errors/WaiterNotFoundException';

import {
  TableSessionUseCase,
  TableSessionWithIncludes,
} from '../abstractions/table-session-use-case';
import { OrderProductNotFoundException } from '../errors/OrderProductNotFoundException';


type Request = {
  waiterId: string;
  orderId: string;
  productId: string;
};

@Injectable()
export class CancelOrderProductWaiter extends TableSessionUseCase<Request> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({
    waiterId,
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

    const waiter = await this.prisma.waiter.findUnique({
      where: {
        id: waiterId,
      },
    });

    if (!waiter) {
      throw new WaiterNotFoundException();
    }

    if (
      orderProduct.order.tableSession.table.restaurantId !==
      waiter.restaurantId
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
