import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsUUID,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateOrderProductItem)
  products: CreateOrderProductItem[];
}

class CreateOrderProductItem {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(1)
  amount: number;
}
