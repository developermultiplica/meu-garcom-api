import { TableSession } from './table-session.entity';

export class Table {
  id: string;
  number: number;
  restaurantId: string;
  waiterId: string | null;
  tableSession: TableSession | null;
}
