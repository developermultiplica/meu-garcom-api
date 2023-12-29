/* eslint-disable prettier/prettier */
import {
  OrderWithIncludes,
  TableSessionWithIncludes,
} from '../abstractions/table-session-use-case';
import { TableSession } from '../entities/table-session.entity';
import { BillItem } from '../entities/table-session/bill-item.entity';
import { TableSessionOrderProduct } from '../entities/table-session/order-product.entity';
import { TableSessionOrderStatus } from '../entities/table-session/order-status';
import { TableSessionOrder } from '../entities/table-session/order.entity';
import { ParticipantBill } from '../entities/table-session/participant-bill.entity';
import { TableSessionParticipant } from '../entities/table-session/participant.entity';

export abstract class TableSessionMapper {
  static toHTTP(tableSession: TableSessionWithIncludes): TableSession {
    const participants = this.getParticipants(tableSession);
    const orders = this.getOrders(tableSession);
    const totalPriceCents = this.getTotalPriceCents(orders);
    const bill = this.getBill(orders);
    const participantsBills = this.getAllParticipantsBills(tableSession);

    return {
      id: tableSession.id,
      restaurantId: tableSession.table.restaurantId,
      tableId: tableSession.tableId,
      status: tableSession.status,
      tableNumber: tableSession.table.number,
      password: tableSession.password,
      waiter: tableSession.table.waiter
        ? { name: tableSession.table.waiter.name }
        : null,
      waiter_notification_id: tableSession.table.waiter
        ? tableSession.table.waiter.onesignal_id
        : null,
      participants,
      orders,
      categories: tableSession.categories,
      bill,
      billPerParticipant: participantsBills,
      totalPriceCents,
      finishedAt: tableSession.finishedAt,
    };
  }

  private static getParticipants(
    tableSession: TableSessionWithIncludes,
  ): TableSessionParticipant[] {
    return tableSession.tableParticipants
      .map((tableParticipant) => ({
        id: tableParticipant.id,
        customerId: tableParticipant.customerId,
        username: tableParticipant.customer.username,
        name: tableParticipant.customer.name,
        isLeader: tableParticipant.isLeader,
        joinedAt: tableParticipant.joinedAt,
      }))
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
  }

  private static getTotalPriceCents(orders: TableSessionOrder[]): number {
    return orders.reduce((acc, order) => {
      const totalOrderPriceInCents = order.products.reduce((acc, product) => {
        if (product.status === 'CANCELED') return acc;
        return acc + product.amount * product.priceInCents;
      }, 0);

      return acc + totalOrderPriceInCents;
    }, 0);
  }

  private static getOrders(
    tableSession: TableSessionWithIncludes,
  ): TableSessionOrder[] {
    return tableSession.orders
      .map<TableSessionOrder>((order) => {
        return {
          id: order.id,
          tableParticipantId: order.tableParticipantId,
          requestedAt: order.requestedAt,
          status: this.getOrderStatus(order),
          products: order.products.map<TableSessionOrderProduct>(
            (orderProduct) => ({
              id: orderProduct.productId,
              name: orderProduct.name,
              description: orderProduct.description,
              status: orderProduct.status,
              imageUrl: orderProduct.imageUrl,
              priceInCents: orderProduct.priceInCents,
              amount: orderProduct.amount,
              canceledAt: orderProduct.canceledAt,
              servedAt: orderProduct.servedAt,
            }),
          ),
        };
      })
      .sort((a, b) => a.requestedAt.getTime() - b.requestedAt.getTime());
  }

  private static getBill(orders: TableSessionOrder[]) {
    return orders
      .reduce<BillItem[]>((acc, order) => {
        order.products.forEach((orderProduct) => {
          if (orderProduct.status === 'CANCELED') {
            return;
          }

          const productIndex = acc.findIndex(
            (i) => i.productId === orderProduct.id,
          );
          const productAlreadyRegistered = productIndex >= 0;
          if (productAlreadyRegistered) {
            acc[productIndex].amount =
              acc[productIndex].amount + orderProduct.amount;

            acc[productIndex].totalPriceCents =
              acc[productIndex].totalPriceCents +
              orderProduct.priceInCents * orderProduct.amount;

            return;
          }

          acc.push({
            productId: orderProduct.id,
            name: orderProduct.name,
            amount: orderProduct.amount,
            imageUrl: orderProduct.imageUrl,
            totalPriceCents: orderProduct.priceInCents * orderProduct.amount,
          });
        });

        return acc;
      }, [])
      .sort((a, b) => b.totalPriceCents - a.totalPriceCents);
  }

  private static getAllParticipantsBills(
    tableSession: TableSessionWithIncludes,
  ): ParticipantBill[] {
    const participants = this.getParticipants(tableSession);

    return participants.map<ParticipantBill>((participant) => {
      const participantOrders = this.getOrders(tableSession).filter(
        (order) => order.tableParticipantId === participant.id,
      );

      return {
        participant,
        bill: this.getBill(participantOrders),
        totalPriceCents: this.getTotalPriceCents(participantOrders),
      };
    });
  }

  private static getOrderStatus(
    order: OrderWithIncludes,
  ): TableSessionOrderStatus {
    if (order.products.every((product) => product.status === 'CANCELED'))
      return TableSessionOrderStatus.CANCELED;
    if (order.products.some((product) => product.status === 'REQUESTED'))
      return TableSessionOrderStatus.REQUESTED;
    return TableSessionOrderStatus.SERVED;
  }
}
