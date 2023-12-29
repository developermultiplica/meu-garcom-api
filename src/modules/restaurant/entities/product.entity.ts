import { ApiProperty } from '@nestjs/swagger';
import { ProductAvailabilityType } from '@prisma/client';

import { Category } from './category.entity';

export class Product {
  id: string;
  name: string;
  description: string;
  restaurantId: string;
  imageUrl: string | null;
  priceInCents: number;
  @ApiProperty({
    enum: ProductAvailabilityType,
    enumName: 'ProductAvailabilityType',
  })
  availabilityType: ProductAvailabilityType;
  availableAmount: number;
  isAvailable: boolean;
  estimatedMinutesToPrepare: number | null;
  category: Category;
}
