import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { RestaurantManagerNotFoundException } from '~/modules/restaurant/errors/restaurant-manager-not-found-exception';
import { WaiterNotFoundException } from '~/modules/waiter/errors/WaiterNotFoundException';

import {
  TableSessionUseCase,
  TableSessionWithIncludes,
} from '../abstractions/table-session-use-case';
import { TableSessionFinishedException } from '../errors/TableSessionFinishedException';
import { TableSessionNotFoundException } from '../errors/TableSessionNotFoundException';

type RequesterRole = 'customer' | 'waiter' | 'restaurant';

type Request = {
  tableSessionId: string;
  requesterId: string;
  requesterRole: RequesterRole;
};

@Injectable()
export class RequestTableSessionPayment extends TableSessionUseCase<Request> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({
    tableSessionId,
    requesterId,
    requesterRole,
  }: Request): Promise<TableSessionWithIncludes> {
    const tableSession = await this.prisma.tableSession.findUnique({
      where: {
        id: tableSessionId,
      },
      include: this.tableSessionInclude,
    });

    if (!tableSession) {
      throw new TableSessionNotFoundException();
    }

    if (!!tableSession.finishedAt) {
      throw new TableSessionFinishedException();
    }

    switch (requesterRole) {
      case 'customer':
        await this.verifyCustomerPermission(requesterId, tableSession);
        break;
      case 'waiter':
        await this.verifyWaiterPermission(requesterId, tableSession);
        break;
      case 'customer':
        await this.verifyRestaurantManagerPermission(requesterId, tableSession);
        break;
    }

    const updatedTableSession = await this.prisma.tableSession.update({
      where: {
        id: tableSessionId,
      },
      data: {
        status: 'REQUESTED_PAYMENT',
        requestedPaymentAt: new Date(),
      },
      include: this.tableSessionInclude,
    });

    return updatedTableSession!;
  }

  private async verifyRestaurantManagerPermission(
    restaurantManagerId: string,
    tableSession: TableSessionWithIncludes,
  ) {
    const restaurantManager = await this.prisma.restaurantManager.findUnique({
      where: {
        id: restaurantManagerId,
      },
    });

    if (!restaurantManager) {
      throw new RestaurantManagerNotFoundException();
    }

    if (tableSession.table.restaurantId !== restaurantManager.restaurantId) {
      throw new BadRequestException(
        'A mesa dessa sessão não está vinculada ao seu estabelecimento',
      );
    }
  }

  private async verifyWaiterPermission(
    waiterId: string,
    tableSession: TableSessionWithIncludes,
  ) {
    const waiter = await this.prisma.waiter.findUnique({
      where: { id: waiterId },
    });

    if (!waiter) {
      throw new WaiterNotFoundException();
    }

    if (waiter.restaurantId !== tableSession.table.restaurantId) {
      throw new BadRequestException(
        'Apenas um garçom do estabelecimento pode solicitar o pagamento',
      );
    }
  }

  private async verifyCustomerPermission(
    customerId: string,
    tableSession: TableSessionWithIncludes,
  ) {
    const participant = await this.prisma.tableParticipant.findUnique({
      where: {
        customerId_tableSessionId: {
          customerId,
          tableSessionId: tableSession.id,
        },
      },
    });

    if (!participant) {
      throw new BadRequestException(
        'Você não está participando da sessão dessa mesa',
      );
    }

    if (!participant.isLeader) {
      throw new BadRequestException(
        'Apenas o líder da sessão dessa mesa pode solicitar o pagamento',
      );
    }
  }
}
