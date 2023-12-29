import { IsUUID } from 'class-validator';

export class GetTableSessionByIdDto {
  @IsUUID()
  tableSessionId: string;
}
