import { IsUUID } from 'class-validator';

export class RestaurantIdDto {
  @IsUUID()
  restaurantId: string;
}
