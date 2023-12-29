/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { isPast } from 'date-fns';
import ShortUniqueId from 'short-unique-id';

import { PrismaService } from '~/infra/prisma/prisma.service';
import { InactiveRestaurantException } from '~/modules/restaurant/errors/inactive-restaurant-exception';
import { CategoryService } from '~/modules/restaurant/services/category.service';

import {
  TableSessionUseCase,
  TableSessionWithIncludes,
} from '../abstractions/table-session-use-case';
import { CreateTableSessionDto } from '../dtos/create-table-session.dto';

type Request = CreateTableSessionDto & {
  customerId: string;
};

@Injectable()
export class CreateTableSession extends TableSessionUseCase<Request> {
  constructor(
    private prisma: PrismaService,
    private categoryService: CategoryService
  ) {
    super();
  }

  async handle(data: Request): Promise<TableSessionWithIncludes> {
    const table = await this.prisma.table.findUnique({
      where: {
        id: data.tableId,
      },
      include: {
        restaurant: true,
      },
    });

    if (!table) {
      throw new BadRequestException(
        'Mesa não foi encontrada. Comunique à gerencia do estabelecimento',
      );
    }

    if (isPast(table.restaurant.expiresAt)) {
      throw new InactiveRestaurantException();
    }

    const tableAlreadyHasSession = await this.prisma.tableSession.findFirst({
      where: {
        tableId: data.tableId,
        finishedAt: null,
      },
    });

    if (tableAlreadyHasSession) {
      throw new BadRequestException(
        'Já existe uma sessão aberta nessa mesa. Comunique à gerencia do estabelecimento',
      );
    }

    const categorias: string[] = await this.categoryService.getCategoryNamesByRestauranteId(table.restaurantId);

    const uid = new ShortUniqueId({ length: 6 });

    const password = String(uid()).toLowerCase();

    return this.prisma.tableSession.create({
      data: {
        password,
        tableId: data.tableId,
        status: 'OPENED',
        openedAt: new Date(),
        finishedAt: null,
        requestedPaymentAt: null,
        categories: categorias,
        tableParticipants: {
          create: {
            customerId: data.customerId,
            isLeader: true,
          },
        },
      },
      include: this.tableSessionInclude,
    });


  }
}
