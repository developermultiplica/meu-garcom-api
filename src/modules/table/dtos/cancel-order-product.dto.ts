import { IsUUID } from 'class-validator';

export class CancelOrderProductDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  productId: string;
}
