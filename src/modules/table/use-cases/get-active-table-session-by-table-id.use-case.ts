import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '~/infra/prisma/prisma.service';

import {
  TableSessionUseCase,
  TableSessionWithIncludes,
} from '../abstractions/table-session-use-case';

type Request = {
  tableId: string;
};

type Response = TableSessionWithIncludes | null;

@Injectable()
export class GetActiveTableSessionByTableId extends TableSessionUseCase<
  Request,
  Response
> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({ tableId }: Request): Promise<Response> {
    const table = await this.prisma.table.findUnique({
      where: {
        id: tableId,
      },
    });

    if (!table) {
      throw new BadRequestException(
        'Mesa não foi encontrada. Comunique à gerencia do estabelecimento',
      );
    }

    return this.prisma.tableSession.findFirst({
      where: {
        tableId,
        finishedAt: null,
      },
      include: this.tableSessionInclude,
    });
  }
}
