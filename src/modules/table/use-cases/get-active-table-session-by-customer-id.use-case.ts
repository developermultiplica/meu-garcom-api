import { BadRequestException, Injectable } from '@nestjs/common';
import { TableSession, TableSessionStatus } from '@prisma/client';

import { PrismaService } from '~/infra/prisma/prisma.service';

import { TableSessionUseCase } from '../abstractions/table-session-use-case';

type Request = {
  customerId: string;
};

type Response = TableSession | null;

@Injectable()
export class GetActiveTableSessionByCustomerId extends TableSessionUseCase<
  Request,
  Response
> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({ customerId }: Request): Promise<Response> {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      throw new BadRequestException('Usuário não encontrado');
    }

    return this.prisma.tableSession.findFirst({
      where: {
        tableParticipants: {
          some: {
            customerId: customer.id,
          },
        },
        status: {
          not: TableSessionStatus.FINISHED,
        },
      },
    });
  }
}
