import { IsString } from 'class-validator';

export class CreateRestaurantManagerDto {
  @IsString()
  name: string;

  @IsString()
  username: string;

  @IsString()
  password: string;
}
