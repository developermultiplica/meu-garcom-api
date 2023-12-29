import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { RestaurantManagerNotFoundException } from '~/modules/restaurant/errors/restaurant-manager-not-found-exception';

import {
  TableSessionUseCase,
  TableSessionWithIncludes,
} from '../abstractions/table-session-use-case';
import { TableSessionFinishedException } from '../errors/TableSessionFinishedException';
import { TableSessionNotFoundException } from '../errors/TableSessionNotFoundException';

type Request = {
  tableSessionId: string;
  restaurantManagerId: string;
};

@Injectable()
export class FinishTableSession extends TableSessionUseCase<Request> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({
    tableSessionId,
    restaurantManagerId,
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

    const tableSessionIsAlreadyFinished = tableSession.status === 'FINISHED';
    if (tableSessionIsAlreadyFinished) {
      throw new TableSessionFinishedException();
    }

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

    const updatedTableSession = await this.prisma.tableSession.update({
      where: {
        id: tableSessionId,
      },
      data: {
        status: 'FINISHED',
        finishedAt: new Date(),
      },
      include: this.tableSessionInclude,
    });

    return updatedTableSession!;
  }
}
