import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ValidateRestaurantDto {
  @IsEmail()
  @ApiProperty({
    type: String,
    example: 'restaurant@test.com',
  })
  username: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: '123456',
  })
  password: string;
}
