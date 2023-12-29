import { IsUUID } from 'class-validator';

export class CreateTableSessionDto {
  @IsUUID()
  tableId: string;
}
