/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { TableSessionStatus } from '@prisma/client';

import { BillItem } from './table-session/bill-item.entity';
import { TableSessionOrder } from './table-session/order.entity';
import { ParticipantBill } from './table-session/participant-bill.entity';
import { TableSessionParticipant } from './table-session/participant.entity';
import { TableSessionWaiter } from './table-session/waiter.entity';

export class TableSession {
  @ApiProperty()
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  password: string;
  waiter: TableSessionWaiter | null;
  waiter_notification_id: string | null;
  @ApiProperty({
    enum: TableSessionStatus,
    enumName: 'TableSessionStatus',
  })
  status: TableSessionStatus;
  participants: TableSessionParticipant[];
  orders: TableSessionOrder[];
  categories: string[];
  bill: BillItem[];
  billPerParticipant: ParticipantBill[];
  totalPriceCents: number;
  finishedAt: Date | null;
}
