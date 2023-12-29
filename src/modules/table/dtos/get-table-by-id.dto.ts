import { IsUUID } from 'class-validator';

export class GetTableByIdDto {
  @IsUUID()
  tableId: string;
}
