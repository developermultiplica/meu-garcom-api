/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { ProductAvailabilityType } from '@prisma/client';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumberString()
  priceInCents: string;

  @IsEnum(ProductAvailabilityType)
  @ApiProperty({
    enum: ProductAvailabilityType,
    required: true,
    enumName: 'ProductAvailabilityType',
  })
  availabilityType: ProductAvailabilityType;

  // @IsOptional()
  @IsNumberString()
  availableAmount?: string;

  @IsOptional()
  @IsNumberString()
  estimatedMinutesToPrepare?: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  image?: Express.Multer.File;
}
