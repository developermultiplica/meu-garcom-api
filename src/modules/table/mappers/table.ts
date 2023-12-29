import { TableWithIncludes } from '../abstractions/table-use-case';
import { Table } from '../entities/table.entity';
import { TableSessionMapper } from './table-session';

export abstract class TableMapper {
  static toHTTP(table: TableWithIncludes): Table {
    return {
      id: table.id,
      number: table.number,
      restaurantId: table.restaurantId,
      waiterId: table.waiterId,
      tableSession: table.tableSession
        ? TableSessionMapper.toHTTP(table.tableSession)
        : null,
    };
  }
}
