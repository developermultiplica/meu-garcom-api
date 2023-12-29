/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductAvailabilityType } from '@prisma/client';

import { PrismaService } from '~/infra/prisma/prisma.service';

import {
  TableSessionUseCase,
  TableSessionWithIncludes,
} from '../abstractions/table-session-use-case';
import { TableSessionFinishedException } from '../errors/TableSessionFinishedException';
import { TableSessionNotFoundException } from '../errors/TableSessionNotFoundException';

type Request = {
  customerId: string;
  tableSessionId: string;
  products: Array<{
    id: string;
    amount: number;
  }>;
};

type CreateOrderParams = {
  participantId: string;
  tableSessionId: string;
  products: Array<{
    id: string;
    amount: number;
  }>;
};

@Injectable()
export class RequestTableSessionOrder extends TableSessionUseCase<Request> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle(data: Request): Promise<TableSessionWithIncludes> {
    const tableSessionExists = await this.prisma.tableSession.findUnique({
      where: {
        id: data.tableSessionId,
      },
    });

    if (!tableSessionExists) {
      throw new TableSessionNotFoundException();
    }

    if (!!tableSessionExists.finishedAt) {
      throw new TableSessionFinishedException();
    }

    const participant = await this.prisma.tableParticipant.findUnique({
      where: {
        customerId_tableSessionId: {
          customerId: data.customerId,
          tableSessionId: data.tableSessionId,
        },
      },
    });

    if (!participant) {
      throw new BadRequestException(
        'Você não está participando dessa sessão da mesa',
      );
    }

    await this.createOrder({
      participantId: participant.id,
      products: data.products,
      tableSessionId: data.tableSessionId,
    });

    const updatedTableSession = await this.prisma.tableSession.findUnique({
      where: {
        id: data.tableSessionId,
      },
      include: this.tableSessionInclude,
    });

    return updatedTableSession!;
  }

  private async createOrder({
    participantId,
    products,
    tableSessionId,
  }: CreateOrderParams) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          tableParticipantId: participantId,
          tableSessionId,
        },
      });

      const createOrderProductsPromises = products.map(async (product) => {
        const requestedProduct = await tx.product.findUnique({
          where: {
            id: product.id,
          },
        });

        if (!requestedProduct) {
          throw new BadRequestException(
            'Um dos produtos solicitados não foi encontrado',
          );
        }

        switch (requestedProduct.availabilityType) {
          case ProductAvailabilityType.QUANTITY:
            if (requestedProduct.availableAmount < product.amount) {
              throw new BadRequestException(
                `${requestedProduct.name} não tem estoque disponível`,
              );
            }

            const updatedProduct = await tx.product.update({
              where: { id: requestedProduct.id },
              data: { availableAmount: { decrement: product.amount } },
            });

            if (updatedProduct.availableAmount < 0) {
              throw new BadRequestException(
                `${requestedProduct.name} não tem estoque disponível`,
              );
            }

            break;

          case ProductAvailabilityType.AVAILABILITY:
            if (!requestedProduct.isAvailable) {
              throw new BadRequestException(
                `${requestedProduct.name} não está disponível`,
              );
            }
        }

        await tx.orderProduct.create({
          data: {
            orderId: order.id,
            productId: requestedProduct.id,
            amount: product.amount,
            priceInCents: requestedProduct.priceInCents,
            name: requestedProduct.name,
            description: requestedProduct.description,
            imageUrl: requestedProduct.imageUrl,
            status: 'REQUESTED',
          },
        });
      });

      await Promise.all(createOrderProductsPromises);
    });
  }
}
