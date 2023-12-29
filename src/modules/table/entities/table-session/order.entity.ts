import { TableSessionOrderProduct } from './order-product.entity';
import { TableSessionOrderStatus } from './order-status';

export class TableSessionOrder {
  id: string;
  tableParticipantId: string;
  requestedAt: Date;
  status: TableSessionOrderStatus;
  products: TableSessionOrderProduct[];
}
