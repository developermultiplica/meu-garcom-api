import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infra/prisma/prisma.service';

import {
  TableSessionUseCase,
  TableSessionWithIncludes,
} from '../abstractions/table-session-use-case';

type Request = {
  id: string;
};

type Response = TableSessionWithIncludes | null;

@Injectable()
export class GetTableSessionById extends TableSessionUseCase<
  Request,
  Response
> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async handle({ id }: Request): Promise<TableSessionWithIncludes | null> {
    return this.prisma.tableSession.findUnique({
      where: { id },
      include: this.tableSessionInclude,
    });
  }
}
