/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '~/infra/prisma/prisma.service';

import {
  TableUseCase,
  TableWithIncludes,
} from '../abstractions/table-use-case';

type Request = {
  waiterId: string;
};

type Response = TableWithIncludes[];

@Injectable()
export class GetWaiterTables extends TableUseCase<Request, Response> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({ waiterId }: Request): Promise<Response> {
    const waiter = await this.prisma.waiter.findUnique({
      where: {
        id: waiterId,
      },
    });

    if (!waiter) {
      throw new BadRequestException('Garçom não foi encontrado');
    }

    const waiterTables = await this.prisma.table.findMany({
      where: {
        waiterId,
      },
      include: this.tableInclude,
      orderBy: {
        number: 'asc',
      },
    });

    const mappedTables = waiterTables.map<TableWithIncludes>((table) => {
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
