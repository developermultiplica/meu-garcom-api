import { ApiProperty } from '@nestjs/swagger';
import { ProductAvailabilityType } from '@prisma/client';
import {
  IsBooleanString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { IsNullable } from '~/helpers/class-validator/is-nullable.decorator';

export class UpdateProductDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumberString()
  priceInCents?: string;

  @IsOptional()
  @IsEnum(ProductAvailabilityType)
  @ApiProperty({
    enum: ProductAvailabilityType,
    enumName: 'ProductAvailabilityType',
  })
  availabilityType?: ProductAvailabilityType;

  @IsOptional()
  @IsNumberString()
  availableAmount?: string;

  @IsOptional()
  @IsBooleanString()
  isAvailable?: string;

  @IsOptional()
  @IsNumberString()
  @IsNullable({
    message: 'estimatedMinutesToPrepare must be string or null',
  })
  estimatedMinutesToPrepare?: string | null;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsNullable({
    message: 'image must a file or null',
  })
  @IsOptional()
  image?: Express.Multer.File;
}
