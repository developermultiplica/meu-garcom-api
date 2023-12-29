import { IsDateString } from 'class-validator';

export class ChangeRestaurantExpirationDto {
  @IsDateString()
  expiresAt: string;
}
