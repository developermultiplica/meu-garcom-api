import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '~/infra/prisma/prisma.service';

import {
  TableSessionUseCase,
  TableSessionWithIncludes,
} from '../abstractions/table-session-use-case';
import { TableSessionFinishedException } from '../errors/TableSessionFinishedException';
import { TableSessionNotFoundException } from '../errors/TableSessionNotFoundException';

type Request = {
  tableSessionId: string;
  customerId: string;
  password: string;
};

@Injectable()
export class JoinTableSession extends TableSessionUseCase<Request> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({
    tableSessionId,
    customerId,
    password,
  }: Request): Promise<TableSessionWithIncludes> {
    const tableSession = await this.prisma.tableSession.findUnique({
      where: {
        id: tableSessionId,
      },
    });

    if (!tableSession) {
      throw new TableSessionNotFoundException();
    }

    const tableSessionIsFinished = !!tableSession.finishedAt;
    if (tableSessionIsFinished) {
      throw new TableSessionFinishedException();
    }

    if (password !== tableSession.password) {
      throw new BadRequestException('Senha da sessão incorreta');
    }

    const userIsAlreadyParticipating =
      await this.prisma.tableParticipant.findUnique({
        where: {
          customerId_tableSessionId: {
            tableSessionId,
            customerId,
          },
        },
      });

    if (userIsAlreadyParticipating) {
      throw new BadRequestException('Você já está participando dessa sessão');
    }

    await this.prisma.tableParticipant.create({
      data: {
        isLeader: false,
        customerId,
        tableSessionId,
      },
      include: this.tableParticipantsInclude,
    });

    const updatedTableSession = await this.prisma.tableSession.findUnique({
      where: {
        id: tableSessionId,
      },
      include: this.tableSessionInclude,
    });

    return updatedTableSession!;
  }
}
