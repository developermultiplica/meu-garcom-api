import { IsString } from 'class-validator';

export class DeleteRestaurantManagerDto {
  @IsString()
  restaurantManagerId: string;
}
