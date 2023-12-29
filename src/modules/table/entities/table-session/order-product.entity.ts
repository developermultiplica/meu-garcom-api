import { ApiProperty } from '@nestjs/swagger';
import { OrderProductStatus } from '@prisma/client';

export class TableSessionOrderProduct {
  @ApiProperty()
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  amount: number;
  imageUrl: string | null;
  @ApiProperty({
    enum: OrderProductStatus,
    enumName: 'OrderProductStatus',
  })
  status: OrderProductStatus;
  servedAt: Date | null;
  canceledAt: Date | null;
}
