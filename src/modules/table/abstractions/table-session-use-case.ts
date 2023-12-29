import {
  Order,
  OrderProduct,
  Prisma,
  Table,
  TableParticipant,
  TableSession,
  Customer,
  Waiter,
  Product,
} from '@prisma/client';

export type TableSessionWithIncludes = TableSession & {
  table: Table & {
    waiter: Waiter | null;
  };
  tableParticipants: TableParticipantWithIncludes[];
  orders: OrderWithIncludes[];
};

export type TableParticipantWithIncludes = TableParticipant & {
  customer: Customer;
};

export type OrderWithIncludes = Order & {
  products: (OrderProduct & {
    product: Product;
  })[];
};

export const tableParticipantsInclude = {
  customer: true,
} satisfies Prisma.TableParticipantInclude;

export const ordersInclude = {
  products: {
    include: {
      product: true,
    },
  },
} satisfies Prisma.OrderInclude;

export const tableSessionInclude = {
  orders: {
    include: ordersInclude,
  },
  tableParticipants: {
    include: tableParticipantsInclude,
  },
  table: {
    include: {
      waiter: true,
    },
  },
} satisfies Prisma.TableSessionInclude;

export abstract class TableSessionUseCase<
  Request,
  Response = TableSessionWithIncludes,
> {
  protected tableParticipantsInclude = tableParticipantsInclude;

  protected ordersInclude = ordersInclude;

  protected tableSessionInclude = tableSessionInclude;

  abstract handle(request: Request): Promise<Response>;
}
