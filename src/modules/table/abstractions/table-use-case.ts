import { Prisma, Table } from '@prisma/client';

import {
  tableSessionInclude,
  TableSessionWithIncludes,
} from './table-session-use-case';

export type TableWithIncludes = Table & {
  tableSession: TableSessionWithIncludes | null;
};

export abstract class TableUseCase<Request, Response = TableWithIncludes> {
  protected tableInclude = {
    tableSessions: {
      take: 1,
      where: {
        status: {
          not: 'FINISHED',
        },
      },
      include: tableSessionInclude,
    },
  } satisfies Prisma.TableInclude;

  abstract handle(request: Request): Promise<Response>;
}
