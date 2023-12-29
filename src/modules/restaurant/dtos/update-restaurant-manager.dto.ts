import { IsOptional, IsString } from 'class-validator';

export class UpdateRestaurantManagerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
